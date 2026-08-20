"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type Toast = ToastProps & {
  open: boolean;
};

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

type Action =
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastProps>; id: string }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "REMOVE_TOAST"; id: string };

type ToastState = {
  toasts: Toast[];
};

const toastReducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [{ ...action.toast, open: true }, ...state.toasts].slice(
          0,
          TOAST_LIMIT,
        ),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t,
        ),
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, open: false } : t,
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
  }
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: ToastState) => void> = [];

let memoryState: ToastState = { toasts: [] };

const dispatch = (action: Action) => {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
};

const remove = (id: string) => {
  dispatch({ type: "DISMISS_TOAST", id });
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), TOAST_REMOVE_DELAY);
};

type ToastInput = Omit<ToastProps, "id">;

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return {
    ...state,
    toast: (input: ToastInput) => {
      const id = genId();
      const toast = { ...input, id, open: true };
      dispatch({ type: "ADD_TOAST", toast });
      remove(id);
      return id;
    },
    dismiss: (id: string) => dispatch({ type: "DISMISS_TOAST", id }),
  };
}

const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={cn(
            "transform rounded-lg border bg-background p-4 shadow-lg transition-all duration-300",
            toastItem.open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            toastItem.variant === "destructive" && "border-destructive"
          )}
        >
          {toastItem.title && (
            <div className="font-semibold text-foreground">{toastItem.title}</div>
          )}
          {toastItem.description && (
            <div className="text-sm text-muted-foreground">{toastItem.description}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export { useToast, Toaster };
