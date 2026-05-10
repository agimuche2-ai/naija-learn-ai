import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

const levels = ["SS1", "SS2", "SS3"] as const;
const terms = ["First Term", "Second Term", "Third Term"] as const;

function LibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("id, title, topic, class_level, category")
        .in("category", terms)
        .in("class_level", levels)
        .order("class_level", { ascending: true })
        .order("category", { ascending: true })
        .order("created_at", { ascending: false });
      setMaterials((data as Material[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const materialsByClassAndTerm = useMemo(() => {
    return levels.reduce(
      (classes, level) => {
        classes[level] = terms.reduce(
          (classTerms, term) => {
            classTerms[term] = materials.filter(
              (material) => material.class_level === level && material.category === term,
            );
            return classTerms;
          },
          {} as Record<(typeof terms)[number], Material[]>,
        );
        return classes;
      },
      {} as Record<(typeof levels)[number], Record<(typeof terms)[number], Material[]>>,
    );
  }, [materials]);

  const countForLevel = (level: (typeof levels)[number]) =>
    terms.reduce((count, term) => count + materialsByClassAndTerm[level][term].length, 0);

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
          <p className="text-sm text-muted-foreground">
            Chemistry lessons arranged by class and school term.
          </p>
        </div>
      </div>

      <Tabs defaultValue="SS1" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {levels.map((level) => (
            <TabsTrigger key={level} value={level} className="gap-2">
              {level}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {countForLevel(level)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {levels.map((level) => (
          <TabsContent key={level} value={level} className="mt-6 space-y-8">
            {terms.map((term) => {
              const termMaterials = materialsByClassAndTerm[level][term];

              return (
                <section key={`${level}-${term}`} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h2 className="font-display text-xl font-bold">{term}</h2>
                      <p className="text-sm text-muted-foreground">
                        {termMaterials.length} lesson{termMaterials.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Badge variant="outline">{level}</Badge>
                  </div>

                  {termMaterials.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {termMaterials.map((material) => (
                        <Link key={material.id} to="/library/$id" params={{ id: material.id }}>
                          <Card className="h-full transition hover:-translate-y-1 hover:shadow-glow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <Badge variant="outline" className="text-[10px] font-bold">
                                  {material.category.toUpperCase()}
                                </Badge>
                                <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </div>
                              <CardTitle className="mt-2 line-clamp-2 text-lg">
                                {material.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{material.topic}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                      No {term.toLowerCase()} materials found for {level}.
                    </div>
                  )}
                </section>
              );
            })}

            {countForLevel(level) === 0 && (
              <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-50" />
                <div>No term-based materials found for {level} yet.</div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
