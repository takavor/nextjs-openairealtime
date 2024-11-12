"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RealtimeClient } from "@openai/realtime-api-beta";
import { ItemType } from "@openai/realtime-api-beta/dist/lib/client.js";
import { WavRecorder, WavStreamPlayer } from "@/lib/wavtools/index.js";

const LOCAL_RELAY_SERVER_URL: string =
  process.env.NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL || "";

export default function Conversation() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // reference to openAI client
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      url: LOCAL_RELAY_SERVER_URL,
    })
  );

  // reference to speech input
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );

  // reference to speech output
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );

  // conversation connection
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    client.updateSession({
      turn_detection: { type: "server_vad" },
      instructions:
        "You are a supervisor at a company meant to interview a candidate. Your name is John. Always reply with audio.",
    });

    setItems(client.conversation.getItems());

    // connect to microphone
    await wavRecorder.begin();

    // connect to audio output
    await wavStreamPlayer.connect();

    // connect to realtime API
    await client.connect();

    setIsConnected(true);

    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello! My name is Sevag.`,
      },
    ]);

    if (client.getTurnDetectionType() === "server_vad") {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  const disconnectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    client.disconnect();
    setIsConnected(false);

    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    client.updateSession({ input_audio_transcription: { model: "whisper-1" } });

    client.on("error", (event: any) => console.error(event));
    client.on("conversation.interrupted", async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });

    client.on("conversation.updated", async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === "completed" && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      client.reset();
    };
  }, []);

  return (
    <div className="">
      <button
        className="bg-gray-200 p-2 m-2 rounded-sm"
        onClick={isConnected ? disconnectConversation : connectConversation}
      >
        {isConnected ? "Disconnect" : "Connect conversation"}
      </button>
      {items.map((conversationItem, i) => {
        return (
          conversationItem.formatted.file && (
            <audio key={i} src={conversationItem.formatted.file.url} controls />
          )
        );
      })}
    </div>
  );
}
