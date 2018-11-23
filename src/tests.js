const moment = require("moment");

const getWeekBreakDown = daysBack => {
  var today = moment().toDate();

  function weeksBetween(d1, d2) {
    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
  }

  const weekNumber = weeksBetween(
    moment(today).subtract(daysBack, "day"),
    today
  );

  // loop by number of times subtracting date by 6 each time to get the dates that start and end the weeks between
  const weeks = {};

  let ctx = {};
  for (count = 1; count < weekNumber + 1; count++) {
    let start;
    let end;
    let daysInWeek = {};

    if (!ctx.start) {
      start = moment().endOf('day');
    } else {
      start = ctx.end;
    }

    end = moment(start).subtract(6, "day").startOf('day');

    ctx = {
      start,
      end
    };

    // get days between start and end
    let daysCtx = {};
    for (dayCount = 1; dayCount < 6; dayCount++) {
      let dayStart;

      if (!daysCtx.start) {
        dayStart = start;
      } else {
        dayStart = daysCtx.start;
      }

      dayStart = moment(dayStart).subtract(1, "day").startOf('day');

      daysCtx = {
        start: dayStart
      };

      daysInWeek[dayCount] = {
        start:moment(dayStart).startOf('day'),
        end:moment(dayStart).endOf('day')
      }
    }

    weeks[count] = {
      start,
      end,
      daysInWeek
    };
  }

  return weeks;
};

const weeks = getWeekBreakDown(14);
console.log(JSON.stringify({ weeks }, null, "\t"));
