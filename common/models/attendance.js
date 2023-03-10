'use strict';

module.exports = function (Attendance) {
    // disable some remote methods
    Attendance.disableRemoteMethodByName('createChangeStream');
    Attendance.disableRemoteMethodByName('count');
    Attendance.disableRemoteMethodByName('exists');
    Attendance.disableRemoteMethodByName('patchOrCreate');
    Attendance.disableRemoteMethodByName('replaceOrCreate');
    Attendance.disableRemoteMethodByName('findOne');
    Attendance.disableRemoteMethodByName('destroyById');
    Attendance.disableRemoteMethodByName('deleteById');
    Attendance.disableRemoteMethodByName('replaceById');
    Attendance.disableRemoteMethodByName('prototype.patchAttributes');
    Attendance.disableRemoteMethodByName('prototype.__create__employee');
    Attendance.disableRemoteMethodByName('prototype.__get__employee');
    Attendance.disableRemoteMethodByName('prototype.__update__employee');
    Attendance.disableRemoteMethodByName('prototype.__destroy__employee');
    Attendance.disableRemoteMethodByName('upsertWithWhere');
    Attendance.disableRemoteMethodByName('update');

    Attendance.observe('before save', function checkAttendanceType(ctx, next) {
        if (!ctx.isNewInstance) {
            return next();
        }

        const allowedTypes = ['hadir', 'izin', 'cuti', 'sakit'];
        if (!allowedTypes.includes(ctx.instance.type)) {
            const error = new Error('Invalid attendance type');
            error.statusCode = 400;
            error.code = 'INVALID_ATTENDANCE_TYPE';
            return next(error);
        }

        next();
    });

    Attendance.observe('before save', function checkCutiIzinApproval(ctx, next) {
        // ctx.instance.status = "oke";
        if (!ctx.isNewInstance) {
            return next();
        }

        const allowedTypes = ['izin', 'cuti'];
        if (allowedTypes.includes(ctx.instance.type)) {
            ctx.instance.status = "pending";
        }

        next();
    });

    // Set default date to today on create
    Attendance.observe('before save', function (ctx, next) {
        if (ctx.instance && !ctx.instance.date) {
            ctx.instance.date = new Date();
        }

        next();
    });

    Attendance.observe('after save', function updateEmployeeAttendance(ctx, next) {
        if (ctx.isNewInstance) {
            const Employee = Attendance.app.models.Employee;
            const employeeId = ctx.instance.employeeId;
            const attendanceType = ctx.instance.type;

            Employee.findById(employeeId, function (err, employee) {
                if (err) {
                    return next(err);
                }

                if (attendanceType === 'hadir') {
                    employee.hadir++;
                } else if (attendanceType === 'sakit') {
                    employee.sakit++;
                }

                employee.save(next);
            });
        } else {
            next();
        }
    });

    // list pending attendances for supervisor
    Attendance.pending = function (cb) {
        Attendance.find({ where: { status: 'pending' } }, cb);
    };
    Attendance.remoteMethod('pending', {
        http: { verb: 'get', path: '/pending' },
        returns: { arg: 'attendances', type: 'array', root: true },
    });

    // Get attendance report for an employee in a month
    Attendance.report = function (employeeId, month, cb) {
        var startDate = new Date(month);
        var endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        const allowedTypes = ['izin', 'cuti'];

        Attendance.find({
            where: {
                and: [
                    { date: { gte: startDate } },
                    { date: { lte: endDate } }
                ],
                employeeId: employeeId,
                // date: { gte: startDate, lte: endDate }
            }
        }, function (err, attendanceList) {
            if (err) return cb(err);

            var report = {
                employeeId: employeeId,
                month: month,
                hadir: 0,
                sakit: 0,
                approvedIzinCutiCount: 0,
                rejectedIzinCutiCount: 0
            };

            console.log(startDate);
            console.log(endDate);
            console.log(attendanceList);

            attendanceList.forEach(function (attendance) {
                if (attendance.status === 'sakit') {
                    report.sakit++;
                } else if (attendance.type === 'hadir') {
                    report.hadir++;
                } else if (attendance.status === 'approved') {
                    if (allowedTypes.includes(attendance.type)) {
                        report.approvedIzinCutiCount++;
                    }
                } else if (attendance.status === 'rejected') {
                    if (allowedTypes.includes(attendance.type)) {
                        report.rejectedIzinCutiCount++;
                    }
                }
            });

            cb(null, report);
        });
    };
    Attendance.remoteMethod('report', {
        description: 'Get attendance report for an employee in a month',
        accepts: [
            { arg: 'id', type: 'string', required: true, description: 'Employee ID' },
            { arg: 'month', type: 'date', required: true, description: 'Date' }
        ],
        returns: { arg: 'report', type: 'object', root: true },
        http: { path: '/:id/report', verb: 'get' }
    });

    // approve an attendance by id
    Attendance.approve = function (id, cb) {
        Attendance.findById(id, function (err, attendance) {
            if (err) return cb(err);
            const Employee = Attendance.app.models.Employee;
            const employeeId = attendance.employeeId;

            Employee.findById(employeeId, function (err, employee) {
                if (err) {
                    return next(err);
                }

                if (attendance.type === 'izin') {
                    employee.izin++;
                } else if (attendance.type === 'cuti') {
                    employee.cuti++;
                }

                employee.save();
            });

            attendance.status = 'approved';
            attendance.save(cb);
        });
    };
    Attendance.remoteMethod('approve', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
        ],
        http: { verb: 'post', path: '/:id/approve' },
        returns: { arg: 'attendance', type: 'object', root: true },
    });

    // reject an attendance by id
    Attendance.reject = function (id, cb) {
        Attendance.findById(id, function (err, attendance) {
            if (err) return cb(err);
            attendance.status = 'rejected';
            attendance.save(cb);
        });
    };
    Attendance.remoteMethod('reject', {
        accepts: [
            { arg: 'id', type: 'string', required: true },
        ],
        http: { verb: 'post', path: '/:id/reject' },
        returns: { arg: 'attendance', type: 'object', root: true },
    });




};