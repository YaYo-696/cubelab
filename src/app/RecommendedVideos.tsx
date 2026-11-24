import { useSyncExternalStore, type ReactNode } from 'react';
import { isYouTubeUrl, type VideoLanguage, type VideoTopic } from '../content/videoTopics';

function subscribe(listener: () => void) {
    window.addEventListener('online', listener);
    window.addEventListener('offline', listener);
    return () => {
        window.removeEventListener('online', listener);
        window.removeEventListener('offline', listener);
    };
}

function onlineSnapshot() {
    return navigator.onLine;
}

function ExternalLink({
    url,
    online,
    children,
}: {
    url: string;
    online: boolean;
    children: ReactNode;
}) {
    return online && isYouTubeUrl(url) ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ) : (
        <span role="link" aria-disabled="true">
            {children}
        </span>
    );
}

export function RecommendedVideos({
    topic,
    language,
    t,
}: {
    topic: VideoTopic;
    language: VideoLanguage;
    t: (key: string) => string;
}) {
    const online = useSyncExternalStore(subscribe, onlineSnapshot);
    return (
        <section className="recommended-videos" aria-labelledby="recommended-videos-title">
            <h3 id="recommended-videos-title">{t('aRecommendedVideos')}</h3>
            {!online && <p role="status">{t('aVideosNeedInternet')}</p>}
            {topic.videos.length > 0 && (
                <ul>
                    {topic.videos.map(({ title, channel, lang, url }) => (
                        <li key={url}>
                            <ExternalLink url={url} online={online}>
                                {title}
                            </ExternalLink>
                            <span>{channel}</span>
                            <abbr
                                className="video-language"
                                title={t(lang === 'es' ? 'aVideoSpanish' : 'aVideoEnglish')}
                            >
                                {lang.toUpperCase()}
                            </abbr>
                        </li>
                    ))}
                </ul>
            )}
            <ExternalLink url={topic.search[language]} online={online}>
                {t('aSearchYouTube')}
            </ExternalLink>
        </section>
    );
}
