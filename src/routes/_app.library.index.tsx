import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/library/")({
  component: LibraryPage,
});

type Material = {
  id: string;
  title: string;
  topic: string;
  class_level: string;
  category: string;
};

function LibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("id, title, topic, class_level, category")
        .order("created_at", { ascending: false });
      setMaterials((data as Material[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const levels = ["SS1", "SS2", "SS3"];

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero shadow-glow">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Study Materials</h1>
          <p className="text-sm text-muted-foreground">Detailed notes and guides for WAEC/NECO.</p>
        </div>
      </div>

      <Tabs defaultValue="SS1" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {levels.map((l) => (
            <TabsTrigger key={l} value={l}>
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        {levels.map((level) => (
          <TabsContent key={level} value={level} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materials
                .filter((m) => m.class_level === level)
                .map((m) => (
                  <Link key={m.id} to="/library/$id" params={{ id: m.id }}>
                    <Card className="h-full transition hover:-translate-y-1 hover:shadow-glow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {m.category.toUpperCase()}
                          </Badge>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-2 line-clamp-2 text-lg">{m.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{m.topic}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              {materials.filter((m) => m.class_level === level).length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No materials found for {level} yet.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
