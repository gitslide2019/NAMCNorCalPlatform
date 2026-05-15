import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PortalLayout } from "@/components/portal-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, FileText, Upload, Download, Trash2, File, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Eyebrow, Stat } from "@/components/editorial";

interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number | null;
  fileType: string | null;
  category: string;
  uploadedById: string;
  createdAt: string;
}

const categories = ["general", "bylaws", "meeting-minutes", "compliance", "forms", "guides"];

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const { data: docs, isLoading } = useQuery<DocumentItem[]>({
    queryKey: ["/api/portal/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest("POST", "/api/portal/documents", {
        title, description, category, fileName: file.name, fileType: file.type, fileSize: file.size, fileData,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/documents"] });
      toast({ title: "Document uploaded" });
      setOpen(false);
      setTitle("");
      setDescription("");
      setFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portal/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const filtered = (docs || []).filter(d => filterCat === "all" || d.category === filterCat);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PortalLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-6 -ml-2" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <header className="border-b border-foreground/10 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="space-y-2">
              <Eyebrow>The library</Eyebrow>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[0.95]" data-testid="text-documents-title">Documents</h1>
              <p className="text-muted-foreground max-w-lg">Shared files, forms, bylaws, and resources — pulled from the chapter's filing cabinet.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[160px] rounded-full" data-testid="select-document-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
              {user?.isAdmin && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full pressable" data-testid="button-upload-document"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Document title" value={title} onChange={e => setTitle(e.target.value)} data-testid="input-doc-title" />
                      <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} data-testid="input-doc-description" />
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger data-testid="select-doc-category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} data-testid="input-doc-file" />
                      <Button onClick={() => uploadMutation.mutate()} disabled={!title || !file || uploadMutation.isPending} className="w-full rounded-full" data-testid="button-submit-document">
                        {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload Document
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          {!isLoading && (docs?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-x-10 gap-y-2 mt-6">
              <Stat value={docs?.length ?? 0} label="On file" data-testid="stat-docs-total" />
              <Stat value={filtered.length} label="In view" data-testid="stat-docs-view" />
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-editorial" data-testid="card-empty-documents">
            <CardContent className="p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" strokeWidth={1.4} />
              <h3 className="font-display text-2xl mb-2">No documents found</h3>
              <p className="text-muted-foreground text-sm">
                {filterCat !== "all" ? "Nothing in this category yet." : "The cabinet's empty for now."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-foreground/10 border-y border-foreground/10 paper-surface">
            {filtered.map(doc => (
              <div key={doc.id} className="group flex items-center justify-between gap-4 px-2 sm:px-4 py-4 hover:bg-primary/5 transition-colors" data-testid={`card-document-${doc.id}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="grid place-items-center h-10 w-10 shrink-0 border border-foreground/15 rounded-md">
                    <File className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base leading-tight truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="truncate max-w-[200px]">{doc.fileName}</span>
                      {doc.fileSize && <span className="tabular-nums">· {formatSize(doc.fileSize)}</span>}
                      <span className="uppercase tracking-wider text-[10px] border-l border-foreground/15 pl-2">{doc.category.replace(/-/g, " ")}</span>
                    </div>
                    {doc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{doc.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="rounded-full pressable" asChild data-testid={`button-download-${doc.id}`}>
                    <a href={`/api/portal/documents/${doc.id}/download`} download><Download className="h-4 w-4" /></a>
                  </Button>
                  {user?.isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
