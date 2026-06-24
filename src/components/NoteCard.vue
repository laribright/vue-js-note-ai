<script setup lang="ts">
import type { Note } from '@/types/note'

defineProps<{
  note: Note
}>()

defineEmits<{
  edit: [note: Note]
  delete: [id: string]
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-2">
    <h3 class="text-lg font-semibold text-gray-900">{{ note.title }}</h3>
    <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ note.content }}</p>

    <div v-if="note.tags?.length" class="flex flex-wrap gap-1 mt-1">
      <span
        v-for="tag in note.tags"
        :key="tag"
        class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full"
      >
        {{ tag }}
      </span>
    </div>

    <div class="flex gap-3 mt-3 text-sm">
      <button
        @click="$emit('edit', note)"
        class="text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Edit
      </button>
      <button @click="$emit('delete', note.id)" class="text-red-500 hover:text-red-700 font-medium">
        Delete
      </button>
    </div>
  </div>
</template>
