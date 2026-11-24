import { expect, it } from 'vitest';
import {
    isYouTubeUrl,
    videoTopicAssociations,
    videoTopicForLesson,
    videoTopics,
} from '../../src/content/videoTopics';
import { makeCourse } from '../../src/puzzles/content/course';
import { loadPyramContent } from '../../src/puzzles/tetra/content';

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
    const pyraminx = (await loadPyramContent()).course;
    const courses = [makeCourse('222'), makeCourse('333'), pyraminx];
    const placed = new Set<string>();
    expect(Object.keys(videoTopicAssociations).sort()).toEqual(
        videoTopics.map(({ topic }) => topic).sort(),
    );
    for (const [topic, { courseId, lessonIds }] of Object.entries(videoTopicAssociations)) {
        expect(lessonIds.length, topic).toBeGreaterThan(0);
        // Without the optional content drop, the technical fixture has its own course ID.
        if (courseId === 'academy-pyram' && pyraminx.id === 'academy-pyram-fixture') continue;
        const course = courses.find(({ id }) => id === courseId);
        expect(course, topic).toBeDefined();
        for (const id of lessonIds) {
            expect(
                course?.modules.some(({ lessons }) => lessons.some((lesson) => lesson.id === id)),
                id,
            ).toBe(true);
            expect(placed.has(courseId + '/' + id), id).toBe(false);
            placed.add(courseId + '/' + id);
            expect(videoTopicForLesson(courseId, id)?.topic).toBe(topic);
        }
    }
    expect(videoTopicForLesson('academy-333', 'notationB')).toBeUndefined();
    expect(videoTopicForLesson('academy-222', 'cross')).toBeUndefined();
    expect(videoTopicForLesson('academy-pyram-fixture', 'pyram-l4e')).toBeUndefined();
});
