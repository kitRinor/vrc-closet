import { PageLayout } from "@/components/pageLayout";
import { fetchBoothItem } from "@/lib/storeInfoUtils/booth";
import { useState } from "react";



export default function _TmpPage() {
  const [input, setInput] = useState<string>("");
  const [content, setContent] =  useState<string|null>(null);

  const handleAction = async () => {
    fetchBoothItem(input).then(data => {
      if (data) {
        setContent(JSON.stringify(data, null, 2));
      } else {
        setContent("No data");
      }
    });
  }

  return (
    <PageLayout>
      <div>Temporary Page</div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Enter BOOTH item URL" style={{ width: '400px' }}/>
      <button onClick={handleAction}>Fetch BOOTH Item Info</button>
      {content && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '20px' }}>
          {content}
        </pre>
      )}

    </PageLayout>
  )
}