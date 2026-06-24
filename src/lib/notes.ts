import { supabase } from '@/lib/supabase'
import type { Note, NoteInput } from '@/types/note'

export async function fetchNotes(): Promise<Note[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createNote(input: NoteInput): Promise<Note> {
    const { data, error } = await supabase
        .from('notes')
        .insert(input)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function updateNote(id: string, input: NoteInput): Promise<Note> {
    const { data, error } = await supabase
        .from('notes')
        .update(input)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteNote(id: string): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function summarizeNote(note: Note): Promise<Note> {
  const { data: aiResult, error: functionError } = await supabase.functions.invoke<{
    summary: string
    tags: string[]
  }>('summarize-note', {
    body: { content: note.content ?? '' }
  })

  if (functionError) throw functionError
  if (!aiResult) throw new Error('No response from summarize-note')

  const { data, error } = await supabase
    .from('notes')
    .update({ summary: aiResult.summary, tags: aiResult.tags })
    .eq('id', note.id)
    .select()
    .single()

  if (error) throw error
  return data
}