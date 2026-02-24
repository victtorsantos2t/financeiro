"use client"

import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    LayoutDashboard,
    Plus,
    Search,
    Settings,
    User,
    Wallet,
    PieChart,
    ArrowRightLeft,
    Moon,
    Sun,
    Monitor
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Digite um comando ou busque..." />
            <CommandList className="scrollbar-hide">
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                <CommandGroup heading="Atalhos Rápidos">
                    <CommandItem onSelect={() => runCommand(() => {
                        window.dispatchEvent(new CustomEvent('open-transaction-modal'));
                        toast.success("Abrindo Nova Transação");
                    })}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Nova Transação</span>
                        <CommandShortcut>T</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => {
                        window.dispatchEvent(new CustomEvent('open-wallet-modal'));
                        toast.success("Abrindo Nova Carteira");
                    })}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Adicionar Carteira</span>
                        <CommandShortcut>W</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Navegação">
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/transactions"))}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        <span>Transações</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/analytics"))}>
                        <PieChart className="mr-2 h-4 w-4" />
                        <span>Analytics</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Aparência">
                    <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Tema Claro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Tema Escuro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}

// aria-label
