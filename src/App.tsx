import { useState, useMemo, useEffect, useRef } from "react";
import { splitSentences, getEngine } from "./utils";
import type { Suggestion } from "./utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
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

function App() {
  const [draft, setDraft] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("neutral");
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [showPolished, setShowPolished] = useState<boolean>(false);
  const [polishedText, setPolishedText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const sentences: string[] = useMemo(() => splitSentences(draft), [draft]);

  const handleSuggestions = async () => {
    if (sentences.length === 0) {
      setSuggestions([]);
      return;
    }
    setIsSuggesting(true);
    let engine = await getEngine();
    let success = false;
    let retry = 0;
    do {
      try {
        const newSuggestions = await engine.getSuggestions(
          sentences,
          selectedTone
        );
        setSuggestions(newSuggestions);
        success = true;
      } catch (e) {
        console.error("Generating suggestions failed:", e);
      } finally {
        setIsSuggesting(false);
      }
      retry++;
      if (retry > 5 && !success) {
        console.error(
          "Generating suggestions failed. Maximum retries reached."
        );
      }
    } while (!success && retry <= 5);
  };

  const handlePolish = async () => {
    setIsPolishing(true);
    let engine = await getEngine();
    if (engine.rewriterAvailable) {
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

  const polishedDraftPanelRef = useRef<ImperativePanelHandle | null>(null);

  useEffect(() => {
    if (polishedDraftPanelRef.current) {
      if (showPolished) polishedDraftPanelRef.current.expand();
      else polishedDraftPanelRef.current.collapse();
    }
  }, [showPolished]);

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
                  placeholder="Start writing here… (Get suggestions on the right)"
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
                    onClick={handlePolish}
                    disabled={!draft.trim() || isPolishing}
                  >
                    {isPolishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Polishing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" /> Generate polished draft
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
          <ResizablePanelGroup
            direction="vertical"
            className="max-h-screen min-h-screen border-0 w-full"
          >
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="flex h-full items-center justify-center">
                <Card className="w-full border-0 rounded-none gap-2 pt-6 pb-0 h-full">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sentence Suggestions
                    </CardTitle>
                    <CardAction>
                      {suggestions.length === 0 ? (
                        <Button
                          onClick={handleSuggestions}
                          disabled={!draft.trim() || isSuggesting}
                        >
                          {isSuggesting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>Get suggestions</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSuggestions}
                          disabled={!draft.trim() || isSuggesting}
                        >
                          {isSuggesting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4" /> Refresh
                            </>
                          )}
                        </Button>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className="overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 mr-2 py-2">
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
                              {suggestions[idx]?.corrected && (
                                <>
                                  <div className="text-sm font-medium mb-1">
                                    Grammar corrected
                                  </div>
                                  <div className="text-sm text-slate-600 mb-1">
                                    {suggestions[idx]?.corrected}
                                  </div>
                                </>
                              )}
                              {suggestions[idx]?.variants.length > 0 && (
                                <>
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
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={50}
              minSize={20}
              collapsible
              collapsedSize={0}
              ref={polishedDraftPanelRef}
            >
              <div className="flex h-full items-center justify-center">
                <Card className="w-full h-full border-0 rounded-none gap-1 pt-6 pb-0">
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
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

export default App;
