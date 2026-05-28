import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useCanEdit } from '../../auth/useRole.js'

export default function TemplateTile({ template }) {
  const canEdit = useCanEdit()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tpl-${template.id}`,
    data: { type: 'NEW_CAMP_ACTIVITY_FROM_TEMPLATE', templateId: template.id, label: template.label, color: template.color },
    disabled: !canEdit,
  })

  return (
    <div
      ref={setNodeRef}
      className={`team-tile${isDragging ? ' team-tile--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), cursor: canEdit ? 'grab' : 'default' }}
      {...listeners}
      {...attributes}
    >
      <span
        className="team-tile__dot"
        style={{ background: template.color ?? '#888', borderColor: template.color ?? '#888', flexShrink: 0 }}
      />
      <span className="team-tile__name">{template.label}</span>
    </div>
  )
}
