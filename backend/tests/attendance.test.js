describe('Attendance Calculation', () => {
  const calculateAttendance = async (session) => {
    const threshold = session.attendanceThreshold;
    const totalMin = (session.actualEnd - session.actualStart) / 60000;
    const records = session.participants.map(p => {
      const pct = Math.round((p.duration / totalMin) * 100 * 100) / 100;
      const lateThreshold = new Date(session.actualStart.getTime() + session.gracePeriod * 60000);
      const isLate = p.joinedAt > lateThreshold;
      const status = pct >= threshold ? (isLate ? 'late' : 'present') : 'absent';
      return { studentId: p.userId, attendancePercentage: pct, status };
    });
    return { records };
  };

  test('Below threshold → absent', async () => {
    const result = await calculateAttendance({
      actualStart: new Date('2025-03-15T09:00'),
      actualEnd: new Date('2025-03-15T10:00'),
      attendanceThreshold: 70,
      gracePeriod: 15,
      participants: [{ userId: 'student1', joinedAt: new Date('2025-03-15T09:00'), duration: 30 }],
    });
    expect(result.records[0].attendancePercentage).toBe(50);
    expect(result.records[0].status).toBe('absent');
  });

  test('After grace period → late', async () => {
    const result = await calculateAttendance({
      actualStart: new Date('2025-03-15T09:00'),
      actualEnd: new Date('2025-03-15T11:00'),
      attendanceThreshold: 70,
      gracePeriod: 15,
      participants: [{ userId: 'student1', joinedAt: new Date('2025-03-15T09:20'), duration: 100 }],
    });
    expect(result.records[0].status).toBe('late');
  });
});
