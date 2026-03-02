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
        <Button variant="ghost" size="sm" onClick={() => setLocation("/portal")} className="mb-4" data-testid="button-back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-documents-title">Documents</h1>
            <p className="text-muted-foreground mt-1">Shared files, forms, and resources for members.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[160px]" data-testid="select-document-category">
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
                  <Button data-testid="button-upload-document"><Upload className="h-4 w-4 mr-2" />Upload</Button>
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
                    <Button onClick={() => uploadMutation.mutate()} disabled={!title || !file || uploadMutation.isPending} className="w-full" data-testid="button-submit-document">
                      {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}Upload Document
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card data-testid="card-empty-documents"><CardContent className="p-8 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No documents found</h3><p className="text-muted-foreground">
            {filterCat !== "all" ? "No documents in this category. Try selecting a different category." : "No documents have been uploaded yet."}
          </p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(doc => (
              <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <File className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{doc.fileName}</span>
                        {doc.fileSize && <span>• {formatSize(doc.fileSize)}</span>}
                        <Badge variant="secondary" className="text-xs">{doc.category.replace(/-/g, " ")}</Badge>
                      </div>
                      {doc.description && <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild data-testid={`button-download-${doc.id}`}>
                      <a href={`/api/portal/documents/${doc.id}/download`} download><Download className="h-4 w-4" /></a>
                    </Button>
                    {user?.isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
