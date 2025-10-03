"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ePub, { Rendition, Location, NavItem } from "epubjs";
import Link from "next/link";
import { useDebouncedCallback } from 'use-debounce';
import { updateBookProgress } from "@/app/actions/bookActions";
import { createHighlight, getHighlightsForBook, deleteHighlight } from "@/app/actions/highlightActions";
import { toast } from "sonner";
import type { Highlight } from "@prisma/client";
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Icons
import {
    Loader2,
    Home,
    ChevronLeft,
    ChevronRight,
    Settings,
    Sun,
    Moon,
    Book as BookIcon,
    ZoomIn,
    ZoomOut,
    Highlighter,
    Check,
    X,
    Trash2,
    List,
    Expand,
    Minimize
} from "lucide-react";

interface EpubViewerProps {
    url: string;
    title: string;
    bookId: string;
}

interface Selection {
    cfiRange: string;
    text: string;
}

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: 'rgba(255, 255, 0, 0.4)' },
    { name: 'Green', value: 'rgba(144, 238, 144, 0.4)' },
    { name: 'Blue', value: 'rgba(173, 216, 230, 0.4)' },
    { name: 'Pink', value: 'rgba(255, 192, 203, 0.4)' },
];

export function EpubViewer({ url, title, bookId }: EpubViewerProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const renditionRef = useRef<Rendition | null>(null);
    const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [uiVisible, setUiVisible] = useState(true);
    const [fontSize, setFontSize] = useState(18);
    const [progress, setProgress] = useState(0);
    const [currentLocation, setCurrentLocation] = useState(0);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [toc, setToc] = useState<NavItem[]>([]); // Estado para o sumário (Table of Contents)
    const [isFullScreen, setIsFullScreen] = useState(false); // Estado para a tela cheia

    const [isHighlighting, setIsHighlighting] = useState(false);
    const [pendingSelection, setPendingSelection] = useState<Selection | null>(null);
    const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const isHighlightingRef = useRef(isHighlighting);
    isHighlightingRef.current = isHighlighting;

    const nextPage = useCallback(() => renditionRef.current?.next(), []);
    const prevPage = useCallback(() => renditionRef.current?.prev(), []);

    const hideUiAfterDelay = useCallback(() => {
        if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
        uiTimeoutRef.current = setTimeout(() => setUiVisible(false), 4000);
    }, []);

    const cancelHideUi = useCallback(() => {
        if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    }, []);

    const toggleUi = useCallback(() => {
        setUiVisible(v => {
            const newVisibility = !v;
            if (newVisibility) {
                hideUiAfterDelay();
            } else {
                cancelHideUi();
                setIsHighlighting(false);
            }
            return newVisibility;
        });
    }, [hideUiAfterDelay, cancelHideUi]);

    const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
        setFontSize(s => Math.max(14, Math.min(s + (direction === 'increase' ? 2 : -2), 28)));
    }, []);

    const setTheme = useCallback((theme: 'light' | 'dark' | 'sepia') => {
        renditionRef.current?.themes.select(theme);
    }, []);

    // NOVA FUNCIONALIDADE: Tela Cheia
    const toggleFullScreen = useCallback(() => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                toast.error(`Erro ao entrar em tela cheia: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const fullscreenChangeHandler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    }, []);


    useEffect(() => {
        if (renditionRef.current) renditionRef.current.themes.fontSize(`${fontSize}px`);
    }, [fontSize]);

    const debouncedUpdateProgress = useDebouncedCallback((loc: Location) => {
        updateBookProgress({ bookId, progress: Math.round(loc.start.percentage * 100), currentLocation: loc.start.cfi });
    }, 2000);

    const handleConfirmHighlight = async () => {
        if (!pendingSelection) return;

        renditionRef.current?.annotations.add("highlight", pendingSelection.cfiRange, {}, undefined, "hl", { "fill": highlightColor });

        const result = await createHighlight({
            bookId,
            cfiRange: pendingSelection.cfiRange,
            text: pendingSelection.text,
            color: highlightColor
        });

        if (result.success && result.highlight) {
            toast.success("Trecho marcado com sucesso!");
            setHighlights(prev => [result.highlight!, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else {
            toast.error("Erro ao marcar o trecho.");
            renditionRef.current?.annotations.remove(pendingSelection.cfiRange, "highlight");
        }
        setPendingSelection(null);
        setIsHighlighting(false);
    }

    const handleCancelHighlight = () => {
        setPendingSelection(null);
        setIsHighlighting(false);
    }

    const handleDeleteHighlight = async (highlightId: string) => {
        const result = await deleteHighlight(highlightId);
        if (result.success && result.cfiRange) {
            renditionRef.current?.annotations.remove(result.cfiRange, "highlight");
            setHighlights(prev => prev.filter(h => h.id !== highlightId));
            toast.success("Marcação removida!");
        } else {
            toast.error(result.error || "Não foi possível remover a marcação.");
        }
    }

    const goToHref = (href: string) => {
        renditionRef.current?.display(href);
        setIsSheetOpen(false);
    }

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
            // NOVA FUNCIONALIDADE: Carrega o sumário (TOC)
            setToc(book.navigation.toc);

            const existingHighlights = await getHighlightsForBook(bookId);
            setHighlights(existingHighlights);

            existingHighlights.forEach(hl => {
                rendition.annotations.add("highlight", hl.cfiRange, {}, undefined, "hl", { "fill": hl.color, "fill-opacity": "0.4" });
            });

            const initialLocation = window.location.hash.substring(1);
            rendition.display(initialLocation || undefined);
            setTheme('light');
            setIsLoading(false);
            hideUiAfterDelay();
        });

        rendition.on("relocated", (loc: Location) => {
            setCurrentLocation(loc.start.location);
            setProgress(Math.round(loc.start.percentage * 100));
            hideUiAfterDelay();
            debouncedUpdateProgress(loc);
        });

        rendition.on("selected", (cfiRange: string) => {
            if (!isHighlightingRef.current) return;

            const range = rendition.getRange(cfiRange);
            const text = range?.toString().trim();
            if (range && text) {
                setPendingSelection({ cfiRange, text });
            }
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
    }, [url, bookId]);

    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-zinc-100 dark:bg-zinc-900 overflow-hidden">

            {isLoading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}

            {isHighlighting && (
                <div
                    style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
                    className="fixed top-4 w-auto bg-background/60 backdrop-blur-xl border rounded-lg p-2 z-40 flex items-center gap-2"
                >
                    <p className="text-sm font-medium mr-2">{pendingSelection ? "Escolha a cor e confirme:" : "Selecione o texto para marcar"}</p>
                    <ToggleGroup type="single" value={highlightColor} onValueChange={(color) => { if (color) setHighlightColor(color) }}>
                        {HIGHLIGHT_COLORS.map(color => (
                            <ToggleGroupItem
                                key={color.name} value={color.value}
                                className="w-7 h-7 rounded-full border-2 border-transparent p-0 data-[state=on]:border-primary"
                                style={{ backgroundColor: color.value.replace('0.4', '1') }}
                            />
                        ))}
                    </ToggleGroup>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 disabled:text-gray-400" onClick={handleConfirmHighlight} disabled={!pendingSelection}>
                        <Check size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelHighlight}>
                        <X size={20} />
                    </Button>
                </div>
            )}

            <div
                style={{ transform: uiVisible ? 'translateY(0%) translateX(-50%)' : 'translateY(150%) translateX(-50%)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
                onMouseEnter={cancelHideUi} onMouseLeave={hideUiAfterDelay}
                className="fixed bottom-4 left-1/2 w-[90%] max-w-4xl bg-background/60 backdrop-blur-xl border rounded-xl p-3 text-center z-30 flex flex-col gap-3 transition-transform duration-300"
            >
                <div className="flex items-center justify-between gap-4 px-1">
                    <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><Home className="h-5 w-5" /></Link></Button>
                    <div className="flex flex-col text-center overflow-hidden">
                        <h1 className="text-sm font-semibold truncate">{title}</h1>
                        <span className="text-xs text-muted-foreground">Localização {currentLocation}</span>
                    </div>
                    <div className="flex items-center">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon"><List className="h-5 w-5" /></Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Navegação</SheetTitle>
                                </SheetHeader>
                                {/* ALTERAÇÃO: Adicionado Tabs para Sumário e Trechos */}
                                <Tabs defaultValue="toc" className="mt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="toc">Capítulos</TabsTrigger>
                                        <TabsTrigger value="highlights">Trechos</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="toc" className="space-y-2 h-[calc(100vh-10rem)] overflow-y-auto pb-10 pr-2">
                                        {toc.length > 0 ? toc.map((item, index) => (
                                            <Button key={index} variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => goToHref(item.href)}>
                                                {item.label}
                                            </Button>
                                        )) : <p className="text-center text-muted-foreground py-10">Sumário não disponível.</p>}
                                    </TabsContent>
                                    <TabsContent value="highlights" className="space-y-4 h-[calc(100vh-10rem)] overflow-y-auto pb-10 pr-2">
                                        {highlights.length > 0 ? highlights.map(hl => (
                                            <div key={hl.id} className="group relative rounded-md border p-4 text-sm hover:bg-muted/50">
                                                <p className="text-muted-foreground italic line-clamp-4">"{hl.text}"</p>
                                                <div className="mt-2 flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => goToHref(hl.cfiRange)}>Ir para</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteHighlight(hl.id)}><Trash2 size={16} /></Button>
                                                </div>
                                            </div>
                                        )) : <p className="text-center text-muted-foreground py-10">Ainda não marcou nenhum trecho.</p>}
                                    </TabsContent>
                                </Tabs>
                            </SheetContent>
                        </Sheet>
                        <Button variant="ghost" size="icon" onClick={() => { setIsHighlighting(true); cancelHideUi(); toast.info("Modo de marcação ativado", { description: "Selecione o texto que deseja marcar." }) }}>
                            <Highlighter className="h-5 w-5" />
                        </Button>
                        <DropdownMenu onOpenChange={(open) => { if (open) cancelHideUi(); else hideUiAfterDelay(); }}>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <div className="px-2 py-1.5 text-sm font-semibold">Fonte</div>
                                <div className="flex items-center justify-center gap-2 px-2 py-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize('decrease')} disabled={fontSize <= 14}><ZoomOut className="h-4 w-4" /></Button>
                                    <span className="text-sm font-medium w-6 text-center">{fontSize}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeFontSize('increase')} disabled={fontSize >= 28}><ZoomIn className="h-4 w-4" /></Button>
                                </div>
                                <div className="px-2 py-1.5 text-sm font-semibold">Tema</div>
                                <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="mr-2 h-4 w-4" /> Claro</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="mr-2 h-4 w-4" /> Escuro</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('sepia')}><BookIcon className="mr-2 h-4 w-4" /> Sépia</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         {/* BOTÃO DE TELA CHEIA ADICIONADO */}
                        <Button variant="ghost" size="icon" onClick={toggleFullScreen}>
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4 px-2">
                    <Progress value={progress} className="w-full" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{progress}%</span>
                </div>
            </div>

            <div className="w-full flex-grow relative flex items-center justify-center group">
                <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={prevPage}><ChevronLeft size={32} /></Button>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={nextPage}><ChevronRight size={32} /></Button>

                <div className="w-full h-full max-w-4xl relative">
                    <div
                        id="viewer"
                        ref={viewerRef}
                        className="w-full h-full"
                        style={{
                            visibility: isLoading ? 'hidden' : 'visible',
                            userSelect: isHighlighting ? 'text' : 'none',
                        }}
                    />
                    {!isHighlighting && (
                        <div className="absolute inset-0 z-10">
                            <div className="absolute left-0 top-0 h-full w-[25%] cursor-pointer" onClick={prevPage}></div>
                            <div className="absolute left-[25%] top-0 h-full w-[50%] cursor-pointer" onClick={toggleUi}></div>
                            <div className="absolute right-0 top-0 h-full w-[25%] cursor-pointer" onClick={nextPage}></div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
