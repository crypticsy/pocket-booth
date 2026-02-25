import { FaCamera, FaDownload, FaArrowLeft, FaTrash } from 'react-icons/fa6';
import { downloadPhotoStrip } from '../utils/photostrip';

type PhotoStripType = {
  id: number;
  photos: string[];
  timestamp: string;
  date: string;
};

type GalleryPageProps = {
  navigateTo: (route: string) => void;
  appState: any;
  setAppState: React.Dispatch<React.SetStateAction<any>>;
};

export const GalleryPage = ({ navigateTo, appState, setAppState }: GalleryPageProps) => {
  const photoStrips: PhotoStripType[] = appState.photoStrips || [];

  const handleDownload = async (strip: PhotoStripType) => {
    await downloadPhotoStrip(strip.photos, `photo-strip-${strip.id}.jpg`);
  };

  const deleteStrip = (id: number) => {
    setAppState((prev: typeof appState) => ({
      ...prev,
      photoStrips: prev.photoStrips.filter((s: PhotoStripType) => s.id !== id),
    }));
  };

  return (
    <div
      className="w-full fixed inset-0 overflow-y-auto"
      style={{
        background: 'var(--cream)',
        color: 'var(--warm-text)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--warm-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            back
          </button>

          <div>
            <h1
              className="font-display text-center"
              style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', color: 'var(--warm-text)' }}
            >
              your gallery.
            </h1>
          </div>

          <div
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ background: 'var(--cream-surface)', color: 'var(--warm-muted)' }}
          >
            {photoStrips.length} strip{photoStrips.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Divider */}
        <div className="accent-line mb-8 mx-auto" style={{ width: 40, height: 2, background: 'var(--accent)' }} />

        {photoStrips.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center py-24 text-center rounded-2xl"
            style={{ background: 'var(--cream-surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--cream)' }}
            >
              <FaCamera className="w-8 h-8" style={{ color: 'var(--border)' }} />
            </div>
            <p className="font-display text-xl mb-2" style={{ color: 'var(--warm-text)' }}>
              no strips yet
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--warm-muted)' }}>
              Head to the booth and take some photos!
            </p>
            <button
              onClick={() => navigateTo('home')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '9999px',
                padding: '0.75rem 1.75rem',
                fontSize: '0.9375rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                boxShadow: '0 4px 12px rgba(196,145,108,0.35)',
              }}
            >
              <FaCamera className="w-4 h-4" />
              take photos
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {photoStrips.map((strip) => (
                <div
                  key={strip.id}
                  className="flex flex-col rounded-2xl overflow-hidden"
                  style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(28,21,16,0.06)',
                  }}
                >
                  {/* Strip preview */}
                  <div
                    className="flex-1 p-2 overflow-y-auto"
                    style={{ maxHeight: 320, background: 'var(--cream-surface)' }}
                  >
                    {strip.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-full block mb-0.5 last:mb-0 rounded-sm"
                      />
                    ))}
                  </div>

                  {/* Footer info */}
                  <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--warm-text)' }}>
                      {strip.date}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--warm-muted)' }}>
                      {strip.timestamp}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => handleDownload(strip)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:opacity-70"
                      style={{ color: 'var(--accent-dark)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FaDownload className="w-3 h-3" />
                      save
                    </button>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <button
                      onClick={() => deleteStrip(strip.id)}
                      className="flex items-center justify-center px-4 py-2.5 transition-colors hover:opacity-70"
                      style={{ color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Take more CTA */}
            <div className="flex justify-center pb-6">
              <button
                onClick={() => navigateTo('home')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--accent)', color: 'white',
                  border: 'none', borderRadius: '9999px',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.9375rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
                  boxShadow: '0 4px 12px rgba(196,145,108,0.35)',
                }}
              >
                <FaCamera className="w-4 h-4" />
                take more photos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
