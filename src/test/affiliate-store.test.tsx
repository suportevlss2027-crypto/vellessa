import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import React from "react";
import { AffiliateStoreProvider, useAffiliateStore } from "@/lib/affiliate-store";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AffiliateStoreProvider>{children}</AffiliateStoreProvider>
);

describe("AffiliateStore Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with clean default profile and empty content", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    expect(result.current.profile.name).toBe("");
    expect(result.current.profile.first).toBe("Afiliada");
    expect(result.current.profile.level).toBe("Afiliada Oficial");
    expect(result.current.totalLessonsCount).toBe(0);
    expect(result.current.progressPercentage).toBe(0);
  });

  it("toggles lesson completion and updates state", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    const testLessonId = "test-lesson-1";
    expect(result.current.isLessonDone(testLessonId)).toBe(false);

    act(() => {
      result.current.toggleLessonDone(testLessonId);
    });

    expect(result.current.isLessonDone(testLessonId)).toBe(true);

    act(() => {
      result.current.toggleLessonDone(testLessonId);
    });

    expect(result.current.isLessonDone(testLessonId)).toBe(false);
  });

  it("updates affiliate profile and saves changes", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    act(() => {
      result.current.updateProfile({
        name: "Renata Martins",
        email: "renata@teste.com",
        first: "Renata",
      });
    });

    expect(result.current.profile.name).toBe("Renata Martins");
    expect(result.current.profile.email).toBe("renata@teste.com");
    expect(result.current.profile.first).toBe("Renata");
  });

  it("adds community posts and toggles likes", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    const initialCount = result.current.posts.length;
    expect(initialCount).toBe(0);

    act(() => {
      result.current.addPost("Minha primeira venda realizada com sucesso!");
    });

    expect(result.current.posts.length).toBe(1);
    const newPost = result.current.posts[0]!;
    expect(newPost.body).toBe("Minha primeira venda realizada com sucesso!");
    expect(newPost.likes).toBe(0);

    act(() => {
      result.current.toggleLikePost(newPost.id);
    });

    const updatedPost = result.current.posts.find((p) => p.id === newPost.id)!;
    expect(updatedPost.likes).toBe(1);
    expect(updatedPost.userLiked).toBe(true);
  });
});
