import groups from '../puzzles/content/full/groups';
import catalog from './videos.json';

export type VideoLanguage = 'es' | 'en';
export type VideoTopic = {
    topic: string;
    appliesTo: Record<VideoLanguage, string>;
    videos: readonly {
        title: string;
        channel: string;
        lang: VideoLanguage;
        url: string;
        verifiedFrom: string;
    }[];
    search: Record<VideoLanguage, string>;
};

export const videoTopics: readonly VideoTopic[] = catalog.topics.map((topic) => ({
    ...topic,
    videos: topic.videos.map((video) => {
        const { lang } = video;
        if (lang !== 'es' && lang !== 'en') throw new Error('Invalid video language: ' + lang);
        return { ...video, lang };
    }),
}));

type Association = { courseId: string; lessonIds: readonly string[] };
export const videoTopicAssociations: Readonly<Record<string, Association>> = {
    '333-beginner': { courseId: 'academy-333', lessonIds: ['cross'] },
    '333-cross': { courseId: 'academy-333', lessonIds: ['crossPlan'] },
    '333-f2l-intuitive': { courseId: 'academy-333', lessonIds: ['f2l'] },
    '333-2look-oll': { courseId: 'academy-333', lessonIds: ['oll3'] },
    '333-2look-pll': { courseId: 'academy-333', lessonIds: ['pll3'] },
    '333-full-oll': { courseId: 'academy-333', lessonIds: groups.fullOLL.map(({ id }) => id) },
    '333-full-pll': { courseId: 'academy-333', lessonIds: groups.fullPLL.map(({ id }) => id) },
    '222-beginner': { courseId: 'academy-222', lessonIds: ['firstLayer'] },
    '222-ortega': { courseId: 'academy-222', lessonIds: ['firstFace'] },
    '222-cll': { courseId: 'academy-222', lessonIds: groups.fullCLL.map(({ id }) => id) },
    'pyram-beginner': { courseId: 'academy-pyram', lessonIds: ['pyram-first-layer', 'pyram-l3e'] },
    'pyram-l4e': { courseId: 'academy-pyram', lessonIds: ['pyram-l4e'] },
    '333-notation': { courseId: 'academy-333', lessonIds: ['notationB'] },
    'skewb-beginner': {
        courseId: 'academy-skewb',
        lessonIds: ['skewb-first-layer', 'skewb-corners', 'skewb-centers'],
    },
    'minx-beginner': {
        courseId: 'academy-minx',
        lessonIds: ['minx-star', 'minx-f2l', 'minx-eo', 'minx-co', 'minx-ep', 'minx-cp'],
    },
    '444-beginner': {
        courseId: 'academy-444',
        lessonIds: ['444-centers', '444-edges', '444-3x3'],
    },
    '444-parity': {
        courseId: 'academy-444',
        lessonIds: ['444-oll-parity', '444-pll-parity'],
    },
    'sq1-beginner': {
        courseId: 'academy-sq1',
        lessonIds: ['sq1-shape', 'sq1-co', 'sq1-eo', 'sq1-cp', 'sq1-ep'],
    },
    'clock-beginner': {
        courseId: 'academy-clock',
        lessonIds: ['clock-front', 'clock-back', 'clock-corners'],
    },
};

export function videoTopicForLesson(courseId: string, lessonId: string) {
    return videoTopics.find(({ topic }) => {
        const association = videoTopicAssociations[topic];
        return association?.courseId === courseId && association.lessonIds.includes(lessonId);
    });
}

export function isYouTubeUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            (url.hostname === 'youtu.be' ||
                url.hostname === 'youtube.com' ||
                url.hostname.endsWith('.youtube.com'))
        );
    } catch {
        return false;
    }
}
