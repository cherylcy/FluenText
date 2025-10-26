import { useState, useMemo } from "react";
import { splitSentences, grammarCorrect, naturalVariants } from "./utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText } from "lucide-react";
import "./App.css";

interface Suggestion {
  corrected: string;
  variants: string[];
}

function App() {
  const [draft, setDraft] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("neutral");

  const sentences: string[] = useMemo(() => splitSentences(draft), [draft]);

  const suggestions: Suggestion[] = useMemo(() => {
    return sentences.map((s) => {
      const corrected = grammarCorrect(s);
      const variants = naturalVariants(s);
      return { corrected, variants };
    });
  }, [sentences]);

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="max-h-screen min-h-screen border-0 min-w-screen"
      >
        <ResizablePanel defaultSize={50}>
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
                <div className="flex justify-end gap-2 my-4 mr-2">
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
                  <Button>Generate polished draft</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center">
            <Card className="w-full h-full border-0 rounded-none gap-2 pt-6 pb-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span>Sentence Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea>
                  <div className="space-y-2">
                    {sentences.map((s, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-100 rounded-2xl p-3 bg-white"
                      >
                        <div className="text-sm mb-2">"{s}"</div>
                        <div className="text-sm font-medium mb-1">
                          Grammar corrected
                        </div>
                        <div className="text-xs text-slate-600 mb-1">
                          {suggestions[idx].corrected}
                        </div>
                        <div className="text-sm font-medium mb-1">
                          More natural
                        </div>
                        {suggestions[idx].variants.map((v, vi) => (
                          <div key={vi} className="text-xs text-slate-600 mb-1">
                            {v}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

export default App;
