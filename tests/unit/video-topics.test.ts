import { expect, it } from 'vitest';
import {
    isYouTubeUrl,
    videoTopicAssociations,
    videoTopicForLesson,
    videoTopics,
} from '../../src/content/videoTopics';
import { registry } from '../../src/puzzles/registry';

it('accepts only HTTPS YouTube URLs and validates every catalog video and search', () => {
    for (const topic of videoTopics) {
        for (const url of [
            ...topic.videos.map((video) => video.url),
            topic.search.es,
            topic.search.en,
        ]) {
            expect(isYouTubeUrl(url), topic.topic + ': ' + url).toBe(true);
        }
    }
    expect(isYouTubeUrl('https://youtu.be/GyY0OxDk5lI')).toBe(true);
    for (const url of [
        'https://notyoutube.com/watch',
        'https://youtube.com.example.com/watch',
        'https://youtube.com@example.com/watch',
        'https://example.com/?next=https://youtube.com',
        'http://www.youtube.com/watch',
        'javascript:alert(1)',
        '//www.youtube.com/watch',
    ]) {
        expect(isYouTubeUrl(url), url).toBe(false);
    }
});

it('maps each video topic to real lessons in the correct course', async () => {
    const puzzles = ['222', '333', 'pyram', 'skewb', 'minx', '444', 'sq1', 'clock'] as const;
    const courses = new Map(
        await Promise.all(
            puzzles.map(async (puzzle) => {
                const mod = await registry[puzzle]();
                const courseId = 'academy-' + puzzle;
                return [courseId, await mod.loadCourse(courseId)] as const;
            }),
        ),
    );
    const placed = new Set<string>();
    expect(Object.keys(videoTopicAssociations).sort()).toEqual(
        videoTopics.map(({ topic }) => topic).sort(),
    );
    for (const [topic, { courseId, lessonIds }] of Object.entries(videoTopicAssociations)) {
        expect(lessonIds.length, topic).toBeGreaterThan(0);
        const course = courses.get(courseId);
        expect(course, topic).toBeDefined();
        const fixture = course?.id === courseId + '-fixture';
        if (!fixture) expect(course?.id, topic).toBe(courseId);
        for (const id of lessonIds) {
            if (fixture) {
                expect(videoTopicForLesson(course.id, id), topic).toBeUndefined();
            } else {
                expect(
                    course?.modules.some(({ lessons }) => lessons.some((lesson) => lesson.id === id)),
                    courseId + '/' + id,
                ).toBe(true);
            }
            expect(placed.has(courseId + '/' + id), id).toBe(false);
            placed.add(courseId + '/' + id);
            expect(videoTopicForLesson(courseId, id)?.topic).toBe(topic);
        }
    }
    expect(videoTopicForLesson('academy-333', 'notationB')?.topic).toBe('333-notation');
    expect(videoTopicForLesson('academy-333', 'notationA')).toBeUndefined();
    expect(videoTopicForLesson('academy-222', 'notationB')).toBeUndefined();
    expect(videoTopicForLesson('academy-222', 'cross')).toBeUndefined();
    expect(videoTopicForLesson('academy-pyram-fixture', 'pyram-l4e')).toBeUndefined();
});
