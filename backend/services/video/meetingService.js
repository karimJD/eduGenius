const { v4: uuidv4 } = require('uuid');

/**
 * Generate a Jitsi meeting URL
 * @param {string} [roomName] - Optional room name; if not provided, a UUID is generated
 * @returns {string} Full Jitsi meeting URL
 */
const generateMeetingUrl = (roomName) => {
  const room = roomName || uuidv4().replace(/-/g, '').substring(0, 16);
  return `https://meet.jit.si/${room}`;
};

/**
 * Create a new meeting
 * @param {{ title: string, classId: string, teacherId: string, startTime: Date, endTime: Date }} params
 * @returns {{ meetingId: string, meetingUrl: string, startTime: Date, endTime: Date, config: object }}
 */
const createMeeting = (params) => {
  const { title, classId, teacherId, startTime, endTime } = params;
  const meetingId = `${classId}-${Date.now()}`;
  const roomName = meetingId.replace(/[^a-zA-Z0-9]/g, '');
  const meetingUrl = generateMeetingUrl(roomName);

  return {
    meetingId,
    meetingUrl,
    startTime,
    endTime,
    config: {
      subject: title,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
    },
  };
};

/**
 * Get basic info about a meeting from its URL
 * @param {string} meetingUrl
 * @returns {{ meetingId: string, provider: string }}
 */
const getMeetingInfo = (meetingUrl) => {
  try {
    const url = new URL(meetingUrl);
    const meetingId = url.pathname.replace('/', '');
    return {
      meetingId,
      provider: 'jitsi',
      meetingUrl,
    };
  } catch {
    return { meetingId: null, provider: 'unknown', meetingUrl };
  }
};

module.exports = { generateMeetingUrl, createMeeting, getMeetingInfo };
