#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <sys/wait.h>
#include <signal.h>
#include <poll.h>
#include <errno.h>
#include <fcntl.h>

static volatile int child_ready = 0;
static volatile pid_t node_pid = 0;
static int child_port = 5001;

static const char ok_response[] =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/plain\r\n"
    "Content-Length: 2\r\n"
    "Connection: close\r\n"
    "\r\n"
    "OK";

static const char bad_gw[] =
    "HTTP/1.1 502 Bad Gateway\r\n"
    "Content-Type: text/plain\r\n"
    "Content-Length: 11\r\n"
    "Connection: close\r\n"
    "\r\n"
    "Bad Gateway";

static void handle_sigchld(int sig) {
    (void)sig;
    int status;
    pid_t p;
    while ((p = waitpid(-1, &status, WNOHANG)) > 0) {
        if (p == node_pid) {
            fprintf(stderr, "Node.js exited with status %d\n", WEXITSTATUS(status));
            _exit(WEXITSTATUS(status));
        }
    }
}

static void relay(int from, int to) {
    char buf[65536];
    struct pollfd pfd = { .fd = from, .events = POLLIN };
    while (1) {
        int ret = poll(&pfd, 1, 5000);
        if (ret <= 0) break;
        int n = read(from, buf, sizeof(buf));
        if (n <= 0) break;
        int written = 0;
        while (written < n) {
            int w = write(to, buf + written, n - written);
            if (w <= 0) return;
            written += w;
        }
    }
}

static void handle_client(int client_fd) {
    char buf[16384];
    int n = read(client_fd, buf, sizeof(buf) - 1);
    if (n <= 0) { close(client_fd); return; }
    buf[n] = 0;

    if (!child_ready) {
        write(client_fd, ok_response, sizeof(ok_response) - 1);
        close(client_fd);
        return;
    }

    int backend = socket(AF_INET, SOCK_STREAM, 0);
    if (backend < 0) {
        write(client_fd, bad_gw, sizeof(bad_gw) - 1);
        close(client_fd);
        return;
    }

    struct sockaddr_in baddr;
    memset(&baddr, 0, sizeof(baddr));
    baddr.sin_family = AF_INET;
    baddr.sin_port = htons(child_port);
    baddr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);

    if (connect(backend, (struct sockaddr*)&baddr, sizeof(baddr)) < 0) {
        close(backend);
        write(client_fd, bad_gw, sizeof(bad_gw) - 1);
        close(client_fd);
        return;
    }

    write(backend, buf, n);

    relay(backend, client_fd);

    close(backend);
    close(client_fd);
}

int main() {
    const char *port_str = getenv("PORT");
    int port = port_str ? atoi(port_str) : 5000;

    signal(SIGCHLD, handle_sigchld);
    signal(SIGPIPE, SIG_IGN);

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    if (listen(server_fd, 128) < 0) {
        perror("listen"); return 1;
    }

    fprintf(stderr, "Boot proxy listening on port %d\n", port);
    fflush(stderr);

    int pipefd[2];
    if (pipe(pipefd) < 0) { perror("pipe"); return 1; }

    pid_t pid = fork();
    if (pid < 0) { perror("fork"); return 1; }

    if (pid == 0) {
        close(server_fd);
        close(pipefd[0]);

        char port_env[32];
        snprintf(port_env, sizeof(port_env), "%d", port);
        setenv("PORT", port_env, 1);

        char pipe_env[32];
        snprintf(pipe_env, sizeof(pipe_env), "%d", pipefd[1]);
        setenv("BOOT_PIPE_FD", pipe_env, 1);

        char child_port_env[32];
        snprintf(child_port_env, sizeof(child_port_env), "%d", child_port);
        setenv("CHILD_PORT", child_port_env, 1);

        execlp("node", "node", "dist/index.cjs", NULL);
        perror("execlp node");
        _exit(1);
    }

    node_pid = pid;
    close(pipefd[1]);

    struct pollfd fds[2];
    fds[0].fd = server_fd;
    fds[0].events = POLLIN;
    fds[1].fd = pipefd[0];
    fds[1].events = POLLIN;

    while (1) {
        int ret = poll(fds, 2, 1000);
        if (ret < 0) {
            if (errno == EINTR) continue;
            perror("poll");
            break;
        }

        if (fds[1].revents & POLLIN) {
            char signal_buf[16];
            int r = read(pipefd[0], signal_buf, sizeof(signal_buf) - 1);
            if (r > 0) {
                signal_buf[r] = 0;
                child_ready = 1;
                child_port = atoi(signal_buf);
                fprintf(stderr, "Node.js ready on port %d, proxying\n", child_port);
                fflush(stderr);
            }
        }

        if (fds[0].revents & POLLIN) {
            struct sockaddr_in caddr;
            socklen_t clen = sizeof(caddr);
            int client = accept(server_fd, (struct sockaddr*)&caddr, &clen);
            if (client >= 0) {
                pid_t cpid = fork();
                if (cpid == 0) {
                    close(server_fd);
                    close(pipefd[0]);
                    handle_client(client);
                    _exit(0);
                }
                close(client);
            }
        }
    }

    close(server_fd);
    return 0;
}
