import { Suspense } from "react";
import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Create your page · Makemylink" };

export default function CreatePage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
