import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

/** A QR code as inline SVG, rendered in `currentColor`.
 *
 *  SVG rather than a canvas or an image: the slab is drawn at whatever size
 *  the layout gives it, from a 44px label cluster to a full-width card page,
 *  and a raster QR either blurs or has to be regenerated per size. Vector
 *  modules stay crisp at any of them.
 *
 *  Correction level "L", matching the app. This code is scanned physically
 *  small — off a phone screen or a printed slab label — and lower redundancy
 *  means fewer modules, so each one renders bigger and a camera can actually
 *  resolve it. The trade is less tolerance for damage, which matters for a
 *  code printed on a parcel, not one rendered fresh on a screen. */
export function QRCode({
  content,
  className,
  title,
}: {
  content: string
  className?: string
  title?: string
}) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'L')
    qr.addData(content)
    qr.make()
    const count = qr.getModuleCount()

    // One path for the whole code rather than a rect per module: a typical
    // code here is 25x25, so that's up to 625 elements versus one.
    let path = ''
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`
      }
    }
    return { path, count }
  }, [content])

  return (
    <svg
      viewBox={`0 0 ${count} ${count}`}
      className={className}
      // Without this the module edges land between device pixels and the
      // whole code softens, which is the difference between scanning and not.
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d={path} fill="currentColor" />
    </svg>
  )
}

/** What the code encodes: the short `/v/<serial>` redirect, matching the app
 *  exactly so a code scanned off a phone and one scanned off the website land
 *  in the same place.
 *
 *  Deliberately short. An earlier version of the app encoded a storage URL of
 *  around 150 characters — two UUIDs in the path — which forced a code dense
 *  enough that phone cameras couldn't resolve it at the slab's real size. */
export function verificationURL(uniqueSerial: string, functionsBase: string) {
  return `${functionsBase}/v/${uniqueSerial}`
}
