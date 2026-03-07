#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <sys/select.h>
#include <time.h>

static const char RESPONSE[] = 
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/plain\r\n"
    "Content-Length: 2\r\n"
    "Connection: close\r\n"
    "\r\n"
    "OK";

int main(int argc, char *argv[]) {
    const char *port_str = getenv("PORT");
    int port = port_str ? atoi(port_str) : 5000;

    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    if (listen(server_fd, 128) < 0) {
        perror("listen"); return 1;
    }

    fprintf(stderr, "Fast health check on port %d\n", port);
    fflush(stderr);

    struct timespec start;
    clock_gettime(CLOCK_MONOTONIC, &start);

    while (1) {
        struct timespec now;
        clock_gettime(CLOCK_MONOTONIC, &now);
        double elapsed = (now.tv_sec - start.tv_sec) + (now.tv_nsec - start.tv_nsec) / 1e9;
        if (elapsed > 5.0) break;

        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(server_fd, &fds);
        struct timeval tv = { .tv_sec = 0, .tv_usec = 200000 };

        if (select(server_fd + 1, &fds, NULL, NULL, &tv) > 0) {
            int client_fd = accept(server_fd, NULL, NULL);
            if (client_fd >= 0) {
                char buf[2048];
                read(client_fd, buf, sizeof(buf));
                write(client_fd, RESPONSE, sizeof(RESPONSE) - 1);
                close(client_fd);
            }
        }
    }

    close(server_fd);
    fprintf(stderr, "Handing off to Node.js\n");
    fflush(stderr);

    char index_path[4096];
    if (argc > 1) {
        strncpy(index_path, argv[1], sizeof(index_path) - 1);
    } else {
        snprintf(index_path, sizeof(index_path), "./dist/index.cjs");
    }

    execlp("node", "node", index_path, NULL);
    perror("exec node");
    return 1;
}
