import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckCircle,
  ArrowLeft,
  Play,
  Lock,
} from "lucide-react";
import type { Course, Lesson, CourseEnrollment } from "@shared/schema";

type View = "catalog" | "detail" | "lesson";

interface CourseDetail extends Course {
  lessons: Lesson[];
  enrollment: CourseEnrollment | null;
}

export default function Courses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<View>("catalog");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [newLessonOrder, setNewLessonOrder] = useState("");

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/portal/courses"],
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<
    CourseEnrollment[]
  >({
    queryKey: ["/api/portal/courses/my-enrollments"],
  });

  const { data: courseDetail, isLoading: detailLoading } =
    useQuery<CourseDetail>({
      queryKey: ["/api/portal/courses", selectedCourseId],
      enabled: !!selectedCourseId && view !== "catalog",
    });

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/portal/courses", {
        title: newCourseTitle,
        description: newCourseDesc,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/courses"] });
      setCreateOpen(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      toast({ title: "Course created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await apiRequest("POST", `/api/portal/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/courses"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/portal/courses/my-enrollments"],
      });
      if (selectedCourseId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/portal/courses", selectedCourseId],
        });
      }
      toast({ title: "Enrolled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "POST",
        `/api/portal/courses/${selectedCourseId}/lessons`,
        {
          title: newLessonTitle,
          content: newLessonContent,
          sortOrder: parseInt(newLessonOrder) || 0,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/portal/courses", selectedCourseId],
      });
      setAddLessonOpen(false);
      setNewLessonTitle("");
      setNewLessonContent("");
      setNewLessonOrder("");
      toast({ title: "Lesson added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!courseDetail || !selectedLesson || !courseDetail.enrollment) return;
      const enrollment = courseDetail.enrollment;
      const completedArr = enrollment.completedLessons
        ? enrollment.completedLessons.split(",").filter(Boolean)
        : [];
      if (!completedArr.includes(selectedLesson.id)) {
        completedArr.push(selectedLesson.id);
      }
      const totalLessons = courseDetail.lessons.length;
      const newProgress = Math.round(
        (completedArr.length / totalLessons) * 100
      );
      await apiRequest(
        "PATCH",
        `/api/portal/courses/${selectedCourseId}/progress`,
        {
          progress: newProgress,
          completedLessons: completedArr.join(","),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/portal/courses", selectedCourseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/portal/courses/my-enrollments"],
      });
      toast({ title: "Lesson marked as complete" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getEnrollment = (courseId: string) =>
    enrollments?.find((e) => e.courseId === courseId);

  const isLessonCompleted = (lessonId: string) => {
    if (!courseDetail?.enrollment?.completedLessons) return false;
    return courseDetail.enrollment.completedLessons
      .split(",")
      .includes(lessonId);
  };

  const openCourseDetail = (courseId: string) => {
    setSelectedCourseId(courseId);
    setView("detail");
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setView("lesson");
  };

  if (view === "lesson" && selectedLesson && courseDetail) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => setView("detail")}
            className="mb-6"
            data-testid="button-back-to-detail"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>

          <div className="mb-6">
            <h1
              className="text-2xl font-bold mb-2"
              data-testid="text-lesson-title"
            >
              {selectedLesson.title}
            </h1>
          </div>

          <Card data-testid="card-lesson-content">
            <CardContent className="p-6">
              <div
                className="whitespace-pre-wrap"
                data-testid="text-lesson-content"
              >
                {selectedLesson.content}
              </div>
            </CardContent>
          </Card>

          {courseDetail.enrollment && (
            <div className="mt-6">
              <Button
                onClick={() => markCompleteMutation.mutate()}
                disabled={
                  markCompleteMutation.isPending ||
                  isLessonCompleted(selectedLesson.id)
                }
                data-testid="button-mark-complete"
              >
                {isLessonCompleted(selectedLesson.id) ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {markCompleteMutation.isPending
                      ? "Saving..."
                      : "Mark Complete"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </PortalLayout>
    );
  }

  if (view === "detail" && selectedCourseId) {
    return (
      <PortalLayout>
        <div className="p-6 sm:p-8 lg:p-10 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => {
              setView("catalog");
              setSelectedCourseId(null);
            }}
            className="mb-6"
            data-testid="button-back-to-catalog"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>

          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : courseDetail ? (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h1
                    className="text-2xl font-bold mb-2"
                    data-testid="text-course-title"
                  >
                    {courseDetail.title}
                  </h1>
                  <p
                    className="text-muted-foreground"
                    data-testid="text-course-description"
                  >
                    {courseDetail.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!courseDetail.enrollment && (
                    <Button
                      onClick={() => enrollMutation.mutate(courseDetail.id)}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll"
                    >
                      {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
                    </Button>
                  )}
                  {user?.isAdmin && (
                    <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" data-testid="button-add-lesson">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lesson
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Lesson</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Input
                            placeholder="Lesson title"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            data-testid="input-lesson-title"
                          />
                          <Textarea
                            placeholder="Lesson content"
                            value={newLessonContent}
                            onChange={(e) => setNewLessonContent(e.target.value)}
                            rows={6}
                            data-testid="input-lesson-content"
                          />
                          <Input
                            type="number"
                            placeholder="Sort order"
                            value={newLessonOrder}
                            onChange={(e) => setNewLessonOrder(e.target.value)}
                            data-testid="input-lesson-order"
                          />
                          <Button
                            onClick={() => addLessonMutation.mutate()}
                            disabled={addLessonMutation.isPending}
                            className="w-full"
                            data-testid="button-submit-lesson"
                          >
                            {addLessonMutation.isPending
                              ? "Adding..."
                              : "Add Lesson"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {courseDetail.enrollment && (
                <Card className="mb-6" data-testid="card-enrollment-progress">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {courseDetail.enrollment.progress}%
                      </span>
                    </div>
                    <Progress
                      value={courseDetail.enrollment.progress}
                      data-testid="progress-course"
                    />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <h2 className="text-lg font-semibold mb-4">Lessons</h2>
                {courseDetail.lessons.length === 0 ? (
                  <p className="text-muted-foreground" data-testid="text-no-lessons">
                    No lessons yet.
                  </p>
                ) : (
                  courseDetail.lessons
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((lesson, index) => {
                      const completed = isLessonCompleted(lesson.id);
                      const enrolled = !!courseDetail.enrollment;
                      return (
                        <Card
                          key={lesson.id}
                          className={`cursor-pointer hover-elevate ${
                            !enrolled ? "opacity-75" : ""
                          }`}
                          onClick={() =>
                            enrolled ? openLesson(lesson) : undefined
                          }
                          data-testid={`card-lesson-${lesson.id}`}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {lesson.title}
                              </p>
                            </div>
                            {completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                            ) : !enrolled ? (
                              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </div>
            </>
          ) : null}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
              data-testid="text-courses-title"
            >
              <GraduationCap className="h-7 w-7" />
              Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              Explore training and development courses
            </p>
          </div>
          {user?.isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-course">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Course title"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    data-testid="input-course-title"
                  />
                  <Textarea
                    placeholder="Course description"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    rows={4}
                    data-testid="input-course-description"
                  />
                  <Button
                    onClick={() => createCourseMutation.mutate()}
                    disabled={createCourseMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-course"
                  >
                    {createCourseMutation.isPending
                      ? "Creating..."
                      : "Create Course"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {coursesLoading || enrollmentsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            data-testid="grid-courses"
          >
            {courses.map((course) => {
              const enrollment = getEnrollment(course.id);
              return (
                <Card
                  key={course.id}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-course-${course.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {enrollment && (
                        <Badge variant="secondary" data-testid={`badge-enrolled-${course.id}`}>
                          Enrolled
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    {enrollment && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {enrollment.progress}%
                          </span>
                        </div>
                        <Progress
                          value={enrollment.progress}
                          data-testid={`progress-${course.id}`}
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => openCourseDetail(course.id)}
                      variant={enrollment ? "default" : "outline"}
                      className="w-full"
                      data-testid={`button-view-course-${course.id}`}
                    >
                      {enrollment ? "Continue" : "Enroll"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card data-testid="card-no-courses">
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground">
                Check back later for new training courses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
