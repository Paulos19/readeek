"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ePub, { Rendition, Location } from "epubjs";
import Link from "next/link";
import { useDrag } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import { useDebouncedCallback } from 'use-debounce';
import { updateBookProgress } from "@/app/actions/bookActions";
import { createHighlight, getHighlightsForBook } from "@/app/actions/highlightActions";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Loader2, Home, ChevronLeft, ChevronRight, Settings, Sun, Moon, Book as BookIcon, ZoomIn, ZoomOut, Highlighter } from "lucide-react";

interface EpubViewerProps {
  url: string;
  title: string;
  bookId: string;
}

interface Selection {
  cfiRange: string;
  text: string;
  rect: DOMRect;
}

export function EpubViewer({ url, title, bookId }: EpubViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [progress, setProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);

  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const nextPage = useCallback(() => renditionRef.current?.next(), []);
  const prevPage = useCallback(() => renditionRef.current?.prev(), []);

  const hideUiAfterDelay = useCallback(() => {
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => setUiVisible(false), 3000);
  }, []);
  
  const cancelHideUi = useCallback(() => {
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
  }, []);

  const toggleUi = useCallback(() => {
    setUiVisible(v => {
      if (!v) hideUiAfterDelay(); else cancelHideUi();
      return !v;
    });
  }, [hideUiAfterDelay, cancelHideUi]);

  const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
    setFontSize(s => Math.max(14, Math.min(s + (direction === 'increase' ? 2 : -2), 28)));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'sepia') => {
    renditionRef.current?.themes.select(theme);
  }, []);
  
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize]);

  const debouncedUpdateProgress = useDebouncedCallback((loc: Location) => {
    updateBookProgress({ bookId, progress: Math.round(loc.start.percentage * 100), currentLocation: loc.start.cfi });
  }, 2000);

  const handleMarkHighlight = async () => {
    if (!selection) return;
    
    renditionRef.current?.annotations.add("highlight", selection.cfiRange, {}, undefined, "hl", { "fill": "yellow", "fill-opacity": "0.3" });
    
    const result = await createHighlight({ bookId, cfiRange: selection.cfiRange, text: selection.text });

    if (result.success) {
      toast.success("Trecho marcado com sucesso!");
    } else {
      toast.error("Erro ao marcar o trecho.");
      renditionRef.current?.annotations.remove(selection.cfiRange, "highlight");
    }
    
    setSelection(null);
  }

  const bind = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    const trigger = vx > 0.2 || Math.abs(mx) > window.innerWidth / 4;
    if (!down && trigger) {
      dx > 0 ? prevPage() : nextPage();
    }
    api.start({ x: down ? mx : 0, immediate: down });
    cancelHideUi();
  }, { onDragEnd: hideUiAfterDelay, axis: 'x' });

  useEffect(() => {
    if (!viewerRef.current) return;
    let rendition: Rendition;

    const book = ePub(url);
    rendition = book.renderTo(viewerRef.current, { width: "100%", height: "100%", spread: "auto", flow: "paginated" });
    renditionRef.current = rendition;

    rendition.themes.register("light", { body: { "background-color": "#FFFFFF", "color": "#000000" } });
    rendition.themes.register("dark", { body: { "background-color": "#121212", "color": "#E0E0E0" } });
    rendition.themes.register("sepia", { body: { "background-color": "#fbf0d9", "color": "#5b4636" } });
    
    book.ready.then(() => book.locations.generate(1650)).then(async () => {
      const existingHighlights = await getHighlightsForBook(bookId);
      existingHighlights.forEach(hl => {
        rendition.annotations.add("highlight", hl.cfiRange, {}, undefined, "hl", { "fill": "yellow", "fill-opacity": "0.3" });
      });

      const initialLocation = window.location.hash.substring(1);
      rendition.display(initialLocation || undefined);
      setTheme('light');
      rendition.themes.fontSize(`${fontSize}px`);
      setIsLoading(false);
      hideUiAfterDelay();
    });

    rendition.on("relocated", (loc: Location) => {
      setCurrentLocation(loc.start.location);
      setProgress(Math.round(loc.start.percentage * 100));
      hideUiAfterDelay();
      debouncedUpdateProgress(loc);
    });
    
    rendition.on("selected", (cfiRange: string, contents: any) => {
        const range = rendition.getRange(cfiRange);
        if (range) {
            const rect = range.getBoundingClientRect();
            setSelection({
                cfiRange,
                text: range.toString(),
                rect,
            });
        }
        contents.window.getSelection().removeAllRanges();
    });

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      renditionRef.current?.destroy();
      document.removeEventListener("keydown", handleKeyPress);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [url, bookId, nextPage, prevPage, setTheme, hideUiAfterDelay, debouncedUpdateProgress, fontSize]);
    
  return (
    // <<< CORREÇÃO APLICADA AQUI: A classe 'select-none' foi removida >>>
    <div className="relative w-screen h-screen flex flex-col items-center bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {selection && (
        <div 
          className="absolute z-40" 
          style={{ 
            left: `${selection.rect.left + selection.rect.width / 2}px`, 
            top: `${selection.rect.top - 40}px`, 
            transform: 'translateX(-50%)' 
          }}
        >
          <Button onClick={handleMarkHighlight}>
            <Highlighter className="mr-2" size={16}/>
            Marcar trecho
          </Button>
        </div>
      )}

       <animated.div
        onMouseEnter={cancelHideUi}
        onMouseLeave={hideUiAfterDelay}
        style={{ 
          transform: uiVisible ? 'translateY(0%) translateX(-50%)' : 'translateY(150%) translateX(-50%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
        className="fixed bottom-4 left-1/2 w-[90%] max-w-4xl bg-background/60 backdrop-blur-xl border rounded-xl p-3 text-center z-30 flex flex-col gap-3 transition-transform duration-300"
      >
        <div className="flex items-center justify-between gap-4 px-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><Home className="h-5 w-5" /></Link>
          </Button>
          <div className="flex flex-col text-center overflow-hidden">
            <h1 className="text-sm font-semibold truncate">{title}</h1>
            <span className="text-xs text-muted-foreground">Localização {currentLocation}</span>
          </div>
          <DropdownMenu onOpenChange={(open) => {
            if (open) {
              cancelHideUi();
            } else {
              hideUiAfterDelay();
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-semibold">Fonte</div>
              <div className="flex items-center justify-center gap-2 px-2 py-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize('decrease')} disabled={fontSize <= 14}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize('increase')} disabled={fontSize >= 28}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-2 py-1.5 text-sm font-semibold">Tema</div>
              <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4"/> Claro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4"/> Escuro</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('sepia')}><BookIcon className="mr-2 h-4 w-4"/> Sépia</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between gap-4 px-2">
            <Progress value={progress} className="w-full" />
            <span className="text-xs text-muted-foreground w-10 text-right">{progress}%</span>
        </div>
      </animated.div>

      <div className="w-full flex-grow relative flex items-center justify-center group">
        <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={prevPage}>
            <ChevronLeft size={32} />
        </Button>
        <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={nextPage}>
            <ChevronRight size={32} />
        </Button>

        <div className="w-full h-full max-w-4xl relative">
          <animated.div
            {...bind()}
            className="absolute inset-0 z-20"
            onPointerDown={() => setSelection(null)}
          >
            <div className="absolute left-0 top-0 h-full w-[25%]" onClick={prevPage}></div>
            <div className="absolute left-[25%] top-0 h-full w-[50%]" onClick={toggleUi}></div>
            <div className="absolute right-0 top-0 h-full w-[25%]" onClick={nextPage}></div>
          </animated.div>
          
          <div
            ref={viewerRef}
            id="viewer"
            className="w-full h-full"
            style={{ visibility: isLoading ? 'hidden' : 'visible' }}
          />
        </div>
      </div>
    </div >
  );
}