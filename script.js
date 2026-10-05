(function () {
        "use strict";
        var time = document.getElementById("time"),
          start = document.getElementById("start"),
          lap = document.getElementById("lap"),
          reset = document.getElementById("reset"),
          ring = document.getElementById("ring"),
          mode = document.getElementById("mode"),
          list = document.getElementById("lapList"),
          count = document.getElementById("lapCount"),
          toast = document.getElementById("toast"),
          historyText = document.getElementById("historyText"),
          running = false,
          started = 0,
          elapsed = 0,
          frame = 0,
          laps = [];
        function now() {
          return performance.now();
        }
        function total() {
          return running ? elapsed + now() - started : elapsed;
        }
        function format(ms, html) {
          var cs = Math.floor(ms / 10) % 100,
            s = Math.floor(ms / 1000) % 60,
            m = Math.floor(ms / 60000) % 60,
            h = Math.floor(ms / 3600000),
            main = [h, m, s]
              .map(function (x) {
                return String(x).padStart(2, "0");
              })
              .join(":");
          return html
            ? main + "<small>." + String(cs).padStart(2, "0") + "</small>"
            : main + "." + String(cs).padStart(2, "0");
        }
        function tick() {
          time.innerHTML = format(total(), true);
          if (running) frame = requestAnimationFrame(tick);
        }
        function controls() {
          start.textContent = running ? "Pause" : elapsed ? "Resume" : "Start";
          lap.disabled = !running;
          reset.disabled = !elapsed && !running;
          ring.classList.toggle("running", running);
          mode.textContent = running ? "RUNNING" : elapsed ? "PAUSED" : "READY";
        }
        function toggle() {
          if (running) {
            elapsed += now() - started;
            running = false;
            cancelAnimationFrame(frame);
          } else {
            started = now();
            running = true;
            frame = requestAnimationFrame(tick);
          }
          controls();
        }
        function addLap() {
          if (!running) return;
          var current = total(),
            previous = laps.length ? laps[laps.length - 1].total : 0;
          laps.push({ total: current, split: current - previous });
          drawLaps();
        }
        function drawLaps() {
          list.innerHTML = "";
          var splits = laps.map(function (x) {
              return x.split;
            }),
            fast = Math.min.apply(null, splits),
            slow = Math.max.apply(null, splits);
          laps
            .slice()
            .reverse()
            .forEach(function (x, index) {
              var row = document.createElement("div"),
                n = laps.length - index;
              row.className =
                "lap" +
                (laps.length > 1 && x.split === fast
                  ? " fast"
                  : laps.length > 1 && x.split === slow
                    ? " slow"
                    : "");
              row.innerHTML =
                "<span>#" +
                String(n).padStart(2, "0") +
                "</span><b>" +
                format(x.split, false) +
                "</b><b>" +
                format(x.total, false) +
                "</b>";
              list.appendChild(row);
            });
          count.textContent =
            laps.length + " LAP" + (laps.length === 1 ? "" : "S");
        }
        function saveSession() {
          if (!elapsed && !laps.length) return;
          var data = {
            date: new Date().toISOString(),
            total: total(),
            laps: laps,
          };
          try {
            localStorage.setItem("chronored:last", JSON.stringify(data));
          } catch (x) {}
          showHistory(data);
        }
        function showHistory(data) {
          historyText.textContent = data
            ? "Finished " +
              new Date(data.date).toLocaleString() +
              " · " +
              format(data.total, false) +
              " · " +
              data.laps.length +
              " laps"
            : "No completed session yet.";
        }
        function doReset() {
          if (!elapsed && !running) return;
          if (!confirm("Finish and reset this stopwatch session?")) return;
          if (running) {
            elapsed += now() - started;
            running = false;
            cancelAnimationFrame(frame);
          }
          saveSession();
          elapsed = 0;
          laps = [];
          time.innerHTML = "00:00:00<small>.00</small>";
          list.innerHTML =
            '<p class="empty">Your lap times will appear here.</p>';
          count.textContent = "0 LAPS";
          controls();
          toast.textContent = "Session saved locally.";
          setTimeout(function () {
            toast.textContent = "";
          }, 2200);
        }
        start.onclick = toggle;
        lap.onclick = addLap;
        reset.onclick = doReset;
        document.addEventListener("keydown", function (ev) {
          if (/input|textarea|select/i.test(ev.target.tagName)) return;
          if (ev.code === "Space") {
            ev.preventDefault();
            toggle();
          }
          if (ev.key.toLowerCase() === "l") addLap();
          if (ev.key.toLowerCase() === "r") doReset();
        });
        document.getElementById("export").onclick = function () {
          var rows = ["Lap,Split,Total"].concat(
            laps.map(function (x, i) {
              return [
                i + 1,
                format(x.split, false),
                format(x.total, false),
              ].join(",");
            }),
          );
          if (!laps.length)
            return (toast.textContent =
              "Add at least one lap before exporting.");
          var blob = new Blob([rows.join("\n")], { type: "text/csv" }),
            a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "chrono-red-laps.csv";
          a.click();
          setTimeout(function () {
            URL.revokeObjectURL(a.href);
          }, 1000);
        };
        document.getElementById("clearHistory").onclick = function () {
          localStorage.removeItem("chronored:last");
          showHistory(null);
        };
        try {
          showHistory(
            JSON.parse(localStorage.getItem("chronored:last") || "null"),
          );
        } catch (x) {}
        controls();
      })();
