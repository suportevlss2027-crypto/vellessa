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

  it("initializes with default profile and calculates lesson progress", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    expect(result.current.profile.name).toBe("Mariana Costa");
    expect(result.current.profile.level).toBe("Afiliada Ouro");
    expect(result.current.totalLessonsCount).toBeGreaterThan(0);
    expect(result.current.progressPercentage).toBeGreaterThanOrEqual(0);
  });

  it("toggles lesson completion and recalculates percentage", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    const initialPercentage = result.current.progressPercentage;
    const testLessonId = "l10"; // Normally undone initially

    const wasDone = result.current.isLessonDone(testLessonId);

    act(() => {
      result.current.toggleLessonDone(testLessonId);
    });

    expect(result.current.isLessonDone(testLessonId)).toBe(!wasDone);

    act(() => {
      result.current.toggleLessonDone(testLessonId);
    });

    expect(result.current.isLessonDone(testLessonId)).toBe(wasDone);
    expect(result.current.progressPercentage).toBe(initialPercentage);
  });

  it("updates affiliate profile and saves changes", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    act(() => {
      result.current.updateProfile({
        name: "Juliana Mendes",
        email: "juliana@teste.com",
        first: "Juliana",
      });
    });

    expect(result.current.profile.name).toBe("Juliana Mendes");
    expect(result.current.profile.email).toBe("juliana@teste.com");
    expect(result.current.profile.first).toBe("Juliana");
  });

  it("adds community posts and toggles likes", () => {
    const { result } = renderHook(() => useAffiliateStore(), { wrapper });

    const initialCount = result.current.posts.length;

    act(() => {
      result.current.addPost("Minha primeira venda realizada com sucesso!");
    });

    expect(result.current.posts.length).toBe(initialCount + 1);
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
