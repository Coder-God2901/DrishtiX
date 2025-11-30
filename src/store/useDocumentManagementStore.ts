import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Document {
  id: string;
  name: string;
  description?: string;
  path: string;
  size: number;
  mimeType: string;
  category: string;
  tags: string[];
  version: number;
  currentVersionId: string;
  versions: DocumentVersion[];
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  permissions: DocumentPermission[];
  locked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  starred: boolean;
  archived: boolean;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  documentId: string;
  name: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeLog?: string;
  hash: string;
}

export interface DocumentPermission {
  userId: string;
  userName: string;
  role: 'viewer' | 'editor' | 'admin';
  grantedBy: string;
  grantedAt: Date;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parentId?: string;
}

export interface DocumentSearchFilter {
  query?: string;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  mimeType?: string;
  starred?: boolean;
  archived?: boolean;
}

interface DocumentManagementState {
  documents: Document[];
  categories: DocumentCategory[];
  selectedDocument: Document | null;
  searchFilter: DocumentSearchFilter;

  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  addVersion: (documentId: string, version: DocumentVersion) => void;
  setCurrentVersion: (documentId: string, versionId: string) => void;

  addPermission: (documentId: string, permission: DocumentPermission) => void;
  removePermission: (documentId: string, userId: string) => void;
  updatePermission: (documentId: string, userId: string, role: DocumentPermission['role']) => void;

  lockDocument: (documentId: string, userId: string) => void;
  unlockDocument: (documentId: string) => void;

  toggleStar: (documentId: string) => void;
  toggleArchive: (documentId: string) => void;

  addTag: (documentId: string, tag: string) => void;
  removeTag: (documentId: string, tag: string) => void;

  addCategory: (category: DocumentCategory) => void;
  updateCategory: (id: string, updates: Partial<DocumentCategory>) => void;
  deleteCategory: (id: string) => void;

  setSelectedDocument: (document: Document | null) => void;
  setSearchFilter: (filter: DocumentSearchFilter) => void;

  searchDocuments: (filter: DocumentSearchFilter) => Document[];
}

export const useDocumentManagementStore = create<DocumentManagementState>()(
  persist(
    (set, get) => ({
      documents: [],
      categories: [
        {
          id: '1',
          name: 'Contracts',
          description: 'Event contracts and agreements',
          color: '#3b82f6',
          icon: 'FileText',
        },
        {
          id: '2',
          name: 'Permits',
          description: 'Permits and licenses',
          color: '#10b981',
          icon: 'Shield',
        },
        {
          id: '3',
          name: 'Floor Plans',
          description: 'Venue floor plans and layouts',
          color: '#f59e0b',
          icon: 'Map',
        },
        {
          id: '4',
          name: 'Reports',
          description: 'Event reports and analytics',
          color: '#8b5cf6',
          icon: 'BarChart',
        },
        {
          id: '5',
          name: 'Photos',
          description: 'Event photos and media',
          color: '#ec4899',
          icon: 'Image',
        },
      ],
      selectedDocument: null,
      searchFilter: {},

      addDocument: (document) => set((state) => ({
        documents: [...state.documents, document],
      })),

      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
        ),
      })),

      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        selectedDocument: state.selectedDocument?.id === id ? null : state.selectedDocument,
      })),

      addVersion: (documentId, version) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? {
              ...d,
              versions: [...d.versions, version],
              version: version.versionNumber,
              currentVersionId: version.id,
              updatedAt: new Date(),
            }
            : d
        ),
      })),

      setCurrentVersion: (documentId, versionId) => set((state) => ({
        documents: state.documents.map((d) => {
          if (d.id === documentId) {
            const version = d.versions.find((v) => v.id === versionId);
            if (version) {
              return {
                ...d,
                currentVersionId: versionId,
                version: version.versionNumber,
                updatedAt: new Date(),
              };
            }
          }
          return d;
        }),
      })),

      addPermission: (documentId, permission) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? { ...d, permissions: [...d.permissions, permission] }
            : d
        ),
      })),

      removePermission: (documentId, userId) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? { ...d, permissions: d.permissions.filter((p) => p.userId !== userId) }
            : d
        ),
      })),

      updatePermission: (documentId, userId, role) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? {
              ...d,
              permissions: d.permissions.map((p) =>
                p.userId === userId ? { ...p, role } : p
              ),
            }
            : d
        ),
      })),

      lockDocument: (documentId, userId) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? { ...d, locked: true, lockedBy: userId, lockedAt: new Date() }
            : d
        ),
      })),

      unlockDocument: (documentId) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? { ...d, locked: false, lockedBy: undefined, lockedAt: undefined }
            : d
        ),
      })),

      toggleStar: (documentId) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId ? { ...d, starred: !d.starred } : d
        ),
      })),

      toggleArchive: (documentId) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId ? { ...d, archived: !d.archived } : d
        ),
      })),

      addTag: (documentId, tag) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId && !d.tags.includes(tag)
            ? { ...d, tags: [...d.tags, tag] }
            : d
        ),
      })),

      removeTag: (documentId, tag) => set((state) => ({
        documents: state.documents.map((d) =>
          d.id === documentId
            ? { ...d, tags: d.tags.filter((t) => t !== tag) }
            : d
        ),
      })),

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category],
      })),

      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),

      setSelectedDocument: (document) => set({ selectedDocument: document }),

      setSearchFilter: (filter) => set({ searchFilter: filter }),

      searchDocuments: (filter) => {
        const { documents } = get();

        return documents.filter((doc) => {
          // Query search
          if (filter.query) {
            const query = filter.query.toLowerCase();
            const searchText = `${doc.name} ${doc.description} ${doc.tags.join(' ')}`.toLowerCase();
            if (!searchText.includes(query)) return false;
          }

          // Category filter
          if (filter.category && doc.category !== filter.category) return false;

          // Tags filter
          if (filter.tags && filter.tags.length > 0) {
            const hasAllTags = filter.tags.every((tag) => doc.tags.includes(tag));
            if (!hasAllTags) return false;
          }

          // Uploaded by filter
          if (filter.uploadedBy && doc.uploadedBy !== filter.uploadedBy) return false;

          // Date range filter
          if (filter.dateFrom && doc.uploadedAt < filter.dateFrom) return false;
          if (filter.dateTo && doc.uploadedAt > filter.dateTo) return false;

          // MIME type filter
          if (filter.mimeType && doc.mimeType !== filter.mimeType) return false;

          // Starred filter
          if (filter.starred !== undefined && doc.starred !== filter.starred) return false;

          // Archived filter
          if (filter.archived !== undefined && doc.archived !== filter.archived) return false;

          return true;
        });
      },
    }),
    {
      name: 'document-management-storage',
      partialize: (state) => ({
        documents: state.documents,
        categories: state.categories,
      }),
    }
  )
);
