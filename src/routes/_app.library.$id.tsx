import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Loader2, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_app/library/$id")({
  component: MaterialDetailPage,
});

type Material = {
  id: string;
  title: string;
  topic: string;
  class_level: string;
  category: string;
  content: string;
};

const terms = ["First Term", "Second Term", "Third Term"];

function MaterialDetailPage() {
  const { id } = Route.useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("*")
        .eq("id", id)
        .single();
      const loadedMaterial = data as Material | null;
      setMaterial(
        loadedMaterial && terms.includes(loadedMaterial.category) ? loadedMaterial : null,
      );
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center">
        <p>Material not found.</p>
        <Button asChild className="mt-4">
          <Link to="/library">Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/library"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
        <Button variant="ghost" size="sm" onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard!");
        }}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </div>

      <Card className="overflow-hidden border-none bg-card shadow-glow">
        <div className="relative h-48 w-full md:h-64">
          <img 
            src={`https://images.unsplash.com/photo-1532187875605-1ef6c237a110?auto=format&fit=crop&q=80&w=1200&topic=${encodeURIComponent(material.topic)}`} 
            alt={material.topic}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
        </div>
        <CardContent className="relative space-y-6 pt-8 pb-12 px-6 md:px-12">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{material.class_level}</Badge>
              <Badge variant="secondary">{material.category}</Badge>
            </div>
            <h1 className="font-display text-3xl font-extrabold md:text-5xl leading-tight">
              {material.title}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">{material.topic}</span>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
             {/* Note: In a real app we would use a markdown renderer like react-markdown */}
             {material.content.split('\n').map((line, i) => {
               if (line.startsWith('# ')) return <h1 key={i} className="mt-8 mb-4 text-3xl font-bold text-primary">{line.slice(2)}</h1>;
               if (line.startsWith('## ')) return <h2 key={i} className="mt-6 mb-3 text-2xl font-bold border-b pb-2 text-primary/90">{line.slice(3)}</h2>;
               if (line.startsWith('### ')) return <h3 key={i} className="mt-5 mb-2 text-xl font-bold text-foreground">{line.slice(4)}</h3>;
               if (line.startsWith('#### ')) return <h4 key={i} className="mt-4 mb-2 text-lg font-bold text-muted-foreground uppercase tracking-wider">{line.slice(5)}</h4>;
               if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc mb-1">{line.slice(2)}</li>;
               if (line.match(/^\d+\. /)) return <li key={i} className="ml-6 list-decimal mb-1">{line.replace(/^\d+\. /, '')}</li>;
               
               // Basic bold handling
               const parts = line.split(/(\*\*.*?\*\*)/);
               if (parts.length > 1) {
                 return (
                   <p key={i} className="mb-4 text-foreground/80 leading-relaxed">
                     {parts.map((part, pi) => 
                       part.startsWith('**') && part.endsWith('**') 
                       ? <strong key={pi} className="font-bold text-foreground">{part.slice(2, -2)}</strong> 
                       : part
                     )}
                   </p>
                 );
               }

               if (!line.trim()) return <div key={i} className="h-2" />;
               return <p key={i} className="mb-4 text-foreground/80 leading-relaxed">{line}</p>;
             })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
