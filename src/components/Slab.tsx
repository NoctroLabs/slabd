import { gradeName } from '../lib/types'
import { QRCode, verificationURL } from './QRCode'
import { FUNCTIONS_BASE } from '../lib/supabase'

export interface SlabCard {
  player: string
  year: string | null
  setName: string | null
  autoType: string | null
  serialNum: string | null
  serialTotal: string | null
  serialKind: string | null
  grade: string | null
  uniqueSerial: string | null
  imageUrl: string | null
}

/** The label's designation block: the big element on the right.
 *
 *  Same precedence as the app. A real grade wins the slot outright, since
 *  it's the rarer fact, and the print run then moves into the detail line
 *  instead of being dropped. Otherwise it's the print run, a special
 *  designation, or the 1-of-1 treatment. */
function Designation({ card }: { card: SlabCard }) {
  if (card.grade) {
    return (
      <div className="text-center leading-none">
        <div className="font-display text-[2.6rem] font-black text-white">{card.grade}</div>
        <div className="font-display mt-0.5 text-[0.8rem] text-white/90">
          {gradeName(card.grade)}
        </div>
      </div>
    )
  }

  const kind = card.serialKind ?? 'Serial'

  if (kind === 'Base') {
    return <div className="font-display text-3xl font-bold text-white">BASE</div>
  }

  if (kind === 'Case Hit' || kind === 'SSP') {
    const [big, caption] = kind === 'Case Hit' ? ['CH', 'Case\nHit'] : ['SP', 'Short\nPrint']
    return (
      <div className="text-center leading-none">
        <div className="font-display text-[2.6rem] font-black text-white">{big}</div>
        <div className="font-display mt-1 text-[0.68rem] leading-tight whitespace-pre-line text-white/90">
          {caption}
        </div>
      </div>
    )
  }

  // A 1-of-1 gets the script treatment with the blue-platinum sheen, the
  // rarest thing on the slab. Gradient-clipped text, so it needs the
  // transparent fill to show through.
  if (card.serialTotal === '1') {
    return (
      <div
        className="font-display bg-clip-text text-4xl italic text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #8CA0B3, #E4EDF5, #FFFFFF, #C7D6E3, #9FB3C4, #EAF1F7)',
        }}
      >
        1 of 1
      </div>
    )
  }

  if (card.serialNum) {
    // Three digits are meaningfully wider than two, so the pair scales down
    // together rather than overflowing its budget — same fix as the app.
    const wide = card.serialNum.length >= 3
    return (
      <div className="text-center leading-none">
        <div
          className={`font-display font-black text-white ${wide ? 'text-[2.1rem]' : 'text-[2.6rem]'}`}
        >
          {card.serialNum}
        </div>
        <div className={`font-display text-white/90 ${wide ? 'text-[0.72rem]' : 'text-[0.85rem]'}`}>
          / {card.serialTotal || '?'}
        </div>
      </div>
    )
  }

  return <div className="font-display text-2xl text-white">—</div>
}

/** The graded-slab treatment: brass label plate over the card photo, with
 *  the SLABD badge straddling the plate's top edge.
 *
 *  Built from CSS rather than reusing the app's case-art PNG. The PNG is
 *  sized for a fixed portrait miniature; on the web this has to reflow from
 *  phone to desktop, and a chrome-bezel bitmap would either stretch or need
 *  slicing. The label proportions and type hierarchy are what carry the
 *  design, and those port exactly. */
export function Slab({ card }: { card: SlabCard }) {
  // When the card is graded, the print run moves down here next to the type,
  // because the grade has taken the designation slot.
  const showSerialInline =
    card.grade && (card.serialKind ?? 'Serial') === 'Serial' && card.serialNum
  const typeLine = showSerialInline
    ? [card.autoType, `${card.serialNum}/${card.serialTotal || '?'}`].filter(Boolean).join(' · ')
    : card.autoType

  const detailLines = [card.year, card.setName, typeLine].filter(Boolean) as string[]

  return (
    <div className="rounded-[20px] border border-[#3a3f4c] bg-gradient-to-b from-[#23262F] to-[#14161C] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="relative mb-2 rounded-[10px] border border-brass bg-[#15171C] px-4 pt-4 pb-4.5">
        <div className="font-display absolute -top-3 left-1/2 -translate-x-1/2 rounded-md border border-brass bg-[#15171C] px-3.5 py-[3px] text-[0.69rem] font-bold tracking-[0.14em] text-brass-bright">
          SLABD
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3.5">
          <div className="min-w-0">
            <p className="font-display truncate text-[1.2rem] font-bold text-brass-bright">
              {card.player}
            </p>
            <div className="font-display text-[0.82rem] leading-[1.45] text-white/85">
              {detailLines.map((line) => (
                <div key={line} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
          {/* The right cluster, in the app's order: code, serial, designation.
              The serial runs vertically between the two, which costs about
              14px of width instead of the 80 it would take set horizontally —
              the reason the app does it that way, and the layout is tighter
              here than on a phone, not looser. */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {card.uniqueSerial && (
              <>
                <QRCode
                  content={verificationURL(card.uniqueSerial, FUNCTIONS_BASE)}
                  title={`Verification code for card ${card.uniqueSerial}`}
                  className="w-9 shrink-0 text-white/90 sm:w-11"
                />
                <span
                  className="figures shrink-0 text-[0.6rem] tracking-[0.04em] text-white/55 [writing-mode:vertical-rl] rotate-180"
                  // Not aria-hidden: this is the card's permanent identifier,
                  // and it's the thing somebody reads out or types in when a
                  // code won't scan. The rotation is presentational only.
                >
                  {card.uniqueSerial}
                </span>
              </>
            )}
            <Designation card={card} />
          </div>
        </div>
      </div>

      <div className="flex aspect-5/7 items-center justify-center overflow-hidden rounded-[10px] bg-raised">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.player}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[0.82rem] text-tertiary">No photo</span>
        )}
      </div>
    </div>
  )
}
