import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { extractText } = await import('unpdf');
        const result = await extractText(uint8Array);

        // Normaliza: result.text pode ser string ou string[]
        let text: string;
        if (Array.isArray(result.text)) {
            text = (result.text as string[]).join('\n');
        } else if (typeof result.text === 'string') {
            text = result.text;
        } else {
            // Tenta serializar qualquer coisa
            text = String(result.text);
        }

        return NextResponse.json({ text });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Falha ao processar PDF';
        console.error('PDF Parse error', e);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
