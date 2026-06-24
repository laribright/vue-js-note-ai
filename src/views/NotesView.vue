<script setup lang="ts">
import { ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { fetchNotes, createNote, updateNote, deleteNote } from '@/lib/notes'
import type { Note, NoteInput } from '@/types/note'
import NoteCard from '@/components/NoteCard.vue'
import NoteForm from '@/components/NoteForm.vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const queryClient = useQueryClient()
const editingNote = ref<Note | null>(null)
const { signOut } = useAuth()
const router = useRouter()

const {
  data: notes,
  isPending,
  isError,
  error,
} = useQuery({
  queryKey: ['notes'],
  queryFn: fetchNotes,
})

const createMutation = useMutation({
  mutationFn: createNote,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  },
})

const updateMutation = useMutation({
  mutationFn: ({ id, input }: { id: string; input: NoteInput }) => updateNote(id, input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
    editingNote.value = null
  },
})

const deleteMutation = useMutation({
  mutationFn: deleteNote,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  },
})

function handleSubmit(formData: NoteInput) {
  if (editingNote.value) {
    updateMutation.mutate({ id: editingNote.value.id, input: formData })
  } else {
    createMutation.mutate(formData)
  }
}

function startEdit(note: Note) {
  editingNote.value = note
}

function cancelEdit() {
  editingNote.value = null
}

function handleDelete(id: string) {
  deleteMutation.mutate(id)
}

async function handleSignOut() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">VueNotes AI</h1>
      <button @click="handleSignOut" class="text-sm text-gray-500 hover:text-gray-700">
        Sign out
      </button>
    </div>

    <NoteForm :editing-note="editingNote" @submit="handleSubmit" @cancel="cancelEdit" />

    <div class="mt-8">
      <p v-if="isPending" class="text-gray-500 text-sm">Loading notes...</p>

      <p v-else-if="isError" class="text-red-500 text-sm">
        Error loading notes: {{ error?.message }}
      </p>

      <p v-else-if="notes?.length === 0" class="text-gray-500 text-sm">
        No notes yet. Add your first one above.
      </p>

      <div v-else class="flex flex-col gap-4">
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          @edit="startEdit"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>
