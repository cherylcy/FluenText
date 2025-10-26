import { useState } from "react";
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
import { FileText } from "lucide-react";
import "./App.css";

function App() {
  const [draft, setDraft] = useState("");
  const [selectedTone, setSelectedTone] = useState("neutral");
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
                  <FileText /> Draft Area
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
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

export default App;
