"use client";
import { URLPattern } from "next/server";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [pattern, setPattern] = useState("");
  const [test, setTest] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    try {
      const match = JSON.stringify(
        new URLPattern(pattern, window.location.origin).exec(
          test,
          window.location.origin
        )?.pathname,
        null,
        2
      );
      if (match !== result) setResult(match);
    } catch {
      if ("invalid pattern" !== result) setResult("invalid pattern");
    }
  }, [pattern, test, result]);
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <input
          type="text"
          onChange={({ target: { value } }) => setPattern(value)}
        />
        <input
          type="text"
          onChange={({ target: { value } }) => setTest(value)}
        />
        {result?.split("\n").map((item, key) => (
          <span key={key}>{item}</span>
        ))}
      </main>
    </div>
  );
}
