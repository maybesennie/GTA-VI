import { useId, useState } from 'react'
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import { CATEGORY_ICONS } from '../components/icons.js'
import {
  DEFAULT_CATEGORIES,
  addCustomItem,
  categoryItems,
  categoryProgress,
  deleteCustomItem,
  overallProgress,
  resetChecklist,
  toggleItem,
} from '../utils/checklist.js'

function AddItemForm({ category, onAdd }) {
  const [text, setText] = useState('')
  const id = useId()

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(category.id, text)
    setText('')
  }

  return (
    <form className="add-item" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={id}>
        Add a custom item to {category.title}
      </label>
      <input
        id={id}
        className="input input--small"
        value={text}
        maxLength={80}
        placeholder="Add your own item"
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn btn--small btn--secondary" disabled={!text.trim()} aria-label={`Add item to ${category.title}`}>
        <Plus size={14} aria-hidden="true" />
        Add
      </button>
    </form>
  )
}

export default function Checklist() {
  const { checklist, setChecklist } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [removeCustom, setRemoveCustom] = useState(false)
  const total = overallProgress(checklist)
  const hasCustom = Object.values(checklist.custom).some((list) => list.length > 0)

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Before launch</p>
          <h1 className="page__title">Preparation Checklist</h1>
          <p className="page__lead">Tick things off as they are packed, charged, tested or bought. Progress saves automatically.</p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setRemoveCustom(false)
              setConfirmReset(true)
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset checklist
          </button>
        </div>
      </header>

      <section className="card total-prep" aria-label="Total preparation progress">
        <ProgressRing value={total.percent} size={96} from="#36E0CF" to="#9747FF" label={`Total preparation ${total.percent} percent`} />
        <div className="total-prep__text">
          <p className="eyebrow">Total preparation</p>
          <p className="total-prep__count">
            {total.done} <span>of {total.total} items done</span>
          </p>
          <ProgressBar value={total.percent} accent="turq" label="Total preparation" />
        </div>
      </section>

      <div className="checklist-grid">
        {DEFAULT_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id]
          const progress = categoryProgress(category, checklist)
          const items = categoryItems(category, checklist)
          return (
            <section className="card category" key={category.id} aria-labelledby={`cat-${category.id}`}>
              <header className="category__head">
                <span className="category__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="category__titles">
                  <h2 id={`cat-${category.id}`} className="category__title">
                    <span className="category__letter" aria-hidden="true">
                      {category.letter}
                    </span>
                    {category.title}
                  </h2>
                  <p className="category__count">
                    {progress.done} of {progress.total} done
                  </p>
                </div>
                <span className={`category__pct ${progress.percent === 100 ? 'is-full' : ''}`}>{progress.percent}%</span>
              </header>
              <ProgressBar value={progress.percent} accent={progress.percent === 100 ? 'turq' : 'pink'} label={`${category.title} progress`} />

              <ul className="items">
                {items.map((item) => {
                  const checked = Boolean(checklist.checked[item.id])
                  return (
                    <li key={item.id} className={`item ${checked ? 'is-checked' : ''}`}>
                      <label className="check">
                        <input type="checkbox" checked={checked} onChange={() => setChecklist((s) => toggleItem(s, item.id))} />
                        <span className="check__box" aria-hidden="true">
                          <Check size={14} strokeWidth={3} />
                        </span>
                        <span className="check__text">{item.text}</span>
                      </label>
                      {item.custom && (
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setChecklist((s) => deleteCustomItem(s, category.id, item.id))}
                          aria-label={`Delete custom item ${item.text}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>

              <AddItemForm category={category} onAdd={(catId, text) => setChecklist((s) => addCustomItem(s, catId, text))} />
            </section>
          )
        })}
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset the checklist?"
          message="Every item is unticked. This can't be undone."
          confirmLabel="Reset checklist"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setChecklist((s) => resetChecklist(s, { removeCustom }))
            setConfirmReset(false)
          }}
        >
          {hasCustom && (
            <label className="toggle toggle--block">
              <input type="checkbox" checked={removeCustom} onChange={(e) => setRemoveCustom(e.target.checked)} />
              <span className="toggle__box" aria-hidden="true" />
              <span>Also delete the custom items I added</span>
            </label>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
