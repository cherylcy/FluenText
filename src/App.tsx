import { useState, useMemo } from "react";
import { splitSentences, AIEngine } from "./utils";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Wand2, Loader2, X, RotateCcw } from "lucide-react";
import "./App.css";

interface Suggestion {
  sentence: string;
  corrected: string;
  variants: string[];
}

function App() {
  const [draft, setDraft] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("neutral");
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [showPolished, setShowPolished] = useState<boolean>(false);
  const [polishedText, setPolishedText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [engine, setEngine] = useState<AIEngine | null>(null);
  const [engineInitialized, setEngineInitialized] = useState<boolean>(false);

  const sentences: string[] = useMemo(() => splitSentences(draft), [draft]);

  const initializeEngine = async () => {
    if (engineInitialized) return;

    const initializedEngine = await AIEngine.createEngine();

    setEngine(initializedEngine);
    setEngineInitialized(true);
    if (engineInitialized) {
      console.log("AI Engine initialized.");
    }
  };

  const handleSuggestions = async () => {
    if (sentences.length === 0 || !engine) {
      setSuggestions([]);
      return;
    }
    setIsSuggesting(true);
    try {
      const resultsPromises = sentences.map(async (s) => {
        const corrected = engine.proofreaderAvailable
          ? await engine.grammarCorrect(s)
          : "";
        const variants = engine.modelAvailable
          ? await engine.naturalVariants(s, selectedTone)
          : [];
        return { sentence: s, corrected, variants };
      });
      const newSuggestions = await Promise.all(resultsPromises);
      setSuggestions(newSuggestions);
      console.log(newSuggestions);
    } catch (e) {
      console.error("Generating suggestions failed:", e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handlePolish = async () => {
    setIsPolishing(true);
    if (engine?.rewriterAvailable) {
      engine
        .polishDraft(draft, selectedTone)
        .then((s) => {
          setPolishedText(s);
          setIsPolishing(false);
          setShowPolished(true);
        })
        .catch((error) => {
          console.error("Polishing failed:", error);
          setIsPolishing(false);
        });
    } else {
      setIsPolishing(false);
      console.error("Rewriter is not available.");
    }
  };

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="max-h-screen min-h-screen border-0 min-w-screen"
      >
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex h-full items-center justify-center">
            <Card className="w-full h-full border-0 rounded-none gap-2 pt-6 pb-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Draft Area
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col justify-between overflow-hidden p-0">
                <Textarea
                  placeholder="Start writing here… (Suggestions appear on the right as you type)"
                  className="text-base h-full resize-none overflow-y-auto border-0 px-8 focus-visible:ring-0 shadow-none"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="flex justify-end gap-2 my-4 mr-2 lg:mr-4">
                  <Select
                    value={selectedTone}
                    onValueChange={(value) => {
                      setSelectedTone(value);
                    }}
                  >
                    <SelectTrigger className="w-[120px] focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (!engineInitialized) initializeEngine();
                      handlePolish();
                    }}
                    disabled={!draft.trim() || isPolishing}
                  >
                    {isPolishing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spoin" />
                        Polishing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate polished draft
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="flex flex-col h-full items-center justify-center overflow-hidden">
            <Card
              className={cn(
                "w-full border-0 rounded-none gap-2 pt-6 pb-0",
                showPolished ? "h-1/2" : "h-full"
              )}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  Sentence Suggestions
                </CardTitle>
                <CardAction>
                  {suggestions.length === 0 ? (
                    <Button
                      onClick={() => {
                        if (!engineInitialized) initializeEngine();
                        handleSuggestions();
                      }}
                      disabled={!draft.trim() || isSuggesting}
                    >
                      Get suggestions
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!engineInitialized) initializeEngine();
                        handleSuggestions();
                      }}
                      disabled={!draft.trim() || isSuggesting}
                    >
                      <RotateCcw className="h-4 w-4" /> Refresh
                    </Button>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {engineInitialized && (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {suggestions
                        .filter((suggestion) => {
                          return (
                            suggestion.corrected !== "" ||
                            suggestion.variants.length !== 0
                          );
                        })
                        .map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="border border-slate-100 rounded-2xl p-3"
                          >
                            <div className="text-sm mb-2">
                              "{suggestion.sentence}"
                            </div>
                            <div className="text-sm font-medium mb-1">
                              Grammar corrected
                            </div>
                            <div className="text-sm text-slate-600 mb-1">
                              {suggestions[idx]?.corrected}
                            </div>
                            <div className="text-sm font-medium mb-1">
                              More natural
                            </div>
                            <ul className="list-disc list-inside">
                              {suggestions[idx]?.variants.map((v, vi) => (
                                <li
                                  key={vi}
                                  className="text-sm text-slate-600 mb-1"
                                >
                                  {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            {showPolished && (
              <Card className="w-full h-1/2 border-0 rounded-none gap-1 pt-6 pb-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4" /> Polished Draft
                  </CardTitle>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPolished(false)}
                      className="h-4 w-4 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="h-full flex flex-col justify-between">
                  <div className="mb-2 text-xs text-slate-500">
                    Tone: {selectedTone}
                  </div>
                  <div className="grow h-0">
                    <ScrollArea className="h-full">
                      <Textarea
                        value={polishedText}
                        readOnly
                        className="border-none shadow-none resize-none focus-visible:ring-0"
                      />
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

export default App;
