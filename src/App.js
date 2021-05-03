import { useRef, useEffect, useState } from "react";
import "./styles.css";

let videoType = "video/webm";
let audioType = "audio/webm";
let extension = "webm";

const initialHistory = [`Initialied...`];
if (navigator.userAgent.indexOf("Safari") !== -1) {
  videoType = "video/mp4";
  audioType = "audio/mp4";
  extension = "mp4";
}

export default function App() {
  const streamRef = useRef();
  const blobsRef = useRef([]);
  const mediaRecorderRef = useRef([]);
  const mediaRef = useRef(null);
  const counterRef = useRef(0);
  const [history, setHistory] = useState(initialHistory);
  const [mimeType, setMimeType] = useState(videoType);
  const [recording, setIsRecording] = useState(false);

  const preview = () => {
    setIsRecording(false);
    setHistory((prev) => [...prev, `Showing the preview`]);
    const blobs = blobsRef.current;
    if (!blobs.length) return;
    mediaRef.current.src = URL.createObjectURL(
      new Blob(blobs, { type: mimeType })
    );
  };

  const startRecording = async () => {
    try {
      blobsRef.current = [];
      setIsRecording(true);
      setHistory((prev) => [...prev, `Video Started`]);
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mimeType === videoType
      });
      setHistory((prev) => [...prev, `Got Media Stream`]);

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType
      });

      setHistory((prev) => [
        ...prev,
        `Media Recored Started with mimeType ${mimeType}`
      ]);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data) {
          counterRef.current += 1;
          setHistory((prev) => [
            ...prev,
            `Recorded...: ${counterRef.current}s`
          ]);
          blobsRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = preview;
      mediaRecorderRef.current.start(1000);
    } catch (err) {
      setHistory((prev) => [...prev, err.message]);
    }
  };

  const stopRecording = () => {
    counterRef.current = 0;
    setIsRecording(false);
    setHistory((prev) => [...prev, `Stopped recording`]);
    if (mediaRecorderRef.current && mediaRecorderRef.current.stop) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const download = () => {
    const file = new Blob(blobsRef.current, { type: mimeType });
    console.log(`File`, file);
    setHistory((prev) => [
      ...prev,
      `Downloading file`,
      `File Size: ${file.size}`
    ]);
    const url = window.URL.createObjectURL(file);
    const name = `${mimeType.split("/")[0]}.${extension}`;
    const a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = name;
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setHistory((prev) => [...prev, `Downloaded: ${name}`]);
  };

  useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.src) {
        URL.revokeObjectURL(mediaRef.current.src);
      }
    };
  }, []);

  return (
    <div className="App">
      <h1>Media Record Testing</h1>

      <div>
        <button
          className={mimeType === videoType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType(videoType)}
        >
          Video
        </button>
        <button
          className={mimeType === audioType ? "active-button" : ""}
          disabled={recording}
          onClick={() => setMimeType(audioType)}
        >
          Audio
        </button>
        <button className="start" disabled={recording} onClick={startRecording}>
          Start
        </button>
        <button className="stop" disabled={!recording} onClick={stopRecording}>
          End
        </button>
        <button className="stop" disabled={recording} onClick={download}>
          Download
        </button>
      </div>

      {mimeType === videoType ? (
        <video ref={mediaRef} controls autoPlay playsInline></video>
      ) : (
        <div className="audio">
          <audio ref={mediaRef} controls autoPlay playsInline></audio>
        </div>
      )}

      <div className="console">
        <button
          className="clear-icon"
          onClick={() => setHistory(initialHistory)}
        >
          Clear
        </button>
        <code>
          <ol>
            {history.map((history, index) => (
              <li key={index}>{history}</li>
            ))}
          </ol>
        </code>
      </div>
    </div>
  );
}
