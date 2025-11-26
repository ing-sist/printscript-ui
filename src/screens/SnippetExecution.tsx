import {OutlinedInput} from "@mui/material";
import {highlight, languages} from "prismjs";
import Editor from "react-simple-code-editor";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {useState} from "react";

type SnippetExecutionProps = {
  outputs?: string[];
  errors?: string[];
}

export const SnippetExecution = ({outputs = [], errors = []}: SnippetExecutionProps) => {
  const [input, setInput] = useState<string>("")

  const code = [...outputs, ...errors.map(e => `ERROR: ${e}`)].join("\n")

  const handleEnter = (event: { key: string }) => {
    if (event.key === 'Enter') {
      //TODO: logic to send inputs to server
      setInput("")
    }
  };

    return (
      <>
        <Bòx flex={1} overflow={"none"} minHeight={200} bgcolor={'black'} color={'white'} code={code}>
            <Editor
              value={code}
              padding={10}
              onValueChange={(code) => setInput(code)}
              highlight={(code) => highlight(code, languages.js, 'javascript')}
              maxLength={1000}
              style={{
                  fontFamily: "monospace",
                  fontSize: 17,
              }}
            />
        </Bòx>
        <OutlinedInput onKeyDown={handleEnter} value={input} onChange={e => setInput(e.target.value)} placeholder="Type here" fullWidth/>
      </>
    )
}
