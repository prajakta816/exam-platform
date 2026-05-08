import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, X, UserRound, KeyRound, ArrowRight, AlertCircle } from "lucide-react";
import API from "../../services/api";

const normalizeCode = (value) => value.trim().toUpperCase();

const LiveJoin = () => {
  const [liveRooms, setLiveRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalCode, setModalCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveRooms = async () => {
      try {
        const { data } = await API.get("/room/live-followed");
        setLiveRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load followed live rooms", err);
        setError(err.response?.data?.message || "Could not load live tests right now.");
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchLiveRooms();
  }, []);

  const openJoinModal = (room) => {
    if (!room.isLive) return;
    setSelectedRoom(room);
    setModalCode("");
    setError("");
  };

  const joinRoom = async (roomCode) => {
    setJoining(true);
    try {
      await API.post("/room/join", { roomCode });
      navigate(`/live-room/${roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const handleModalJoin = async (e) => {
    e.preventDefault();
    setError("");

    const enteredCode = normalizeCode(modalCode);
    const selectedCode = normalizeCode(selectedRoom?.roomCode || "");

    if (enteredCode !== selectedCode) {
      setError("Invalid room code");
      return;
    }

    await joinRoom(selectedCode);
  };

  const handleManualJoin = async (e) => {
    e.preventDefault();
    setError("");

    const enteredCode = normalizeCode(manualCode);
    if (!enteredCode) return;

    await joinRoom(enteredCode);
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Radio size={16} />
            Live Tests
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3">Join Live Test</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Pick a live quiz from teachers you follow, then confirm the room code to enter.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-center gap-3 font-bold">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Live from Followed Teachers</h2>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{liveRooms.length} Available</span>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : liveRooms.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {liveRooms.map((room) => (
                <div key={room.roomCode} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center overflow-hidden">
                        {room.teacherProfileImage ? (
                          <img src={`http://localhost:5000/${room.teacherProfileImage}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserRound size={24} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Teacher</p>
                        <h3 className="font-black text-slate-900 dark:text-white">{room.teacherName}</h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">Live</span>
                  </div>

                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quiz Name</p>
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 line-clamp-2">{room.testName}</h4>

                  <button
                    type="button"
                    onClick={() => openJoinModal(room)}
                    disabled={!room.isLive}
                    className={`w-full py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                      room.isLive
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Join <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
              No followed teachers have a live test right now.
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <KeyRound className="text-indigo-600" size={22} />
            Have a code?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-5 font-medium">You can still join directly with a room code.</p>
          <form onSubmit={handleManualJoin} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              maxLength={6}
              className="flex-1 text-center sm:text-left text-2xl tracking-widest font-black px-4 py-3 border-2 border-dashed rounded-2xl dark:bg-slate-800 dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
              value={manualCode}
              onChange={(e) => setManualCode(normalizeCode(e.target.value))}
              placeholder="XXXXXX"
            />
            <button
              type="submit"
              disabled={joining || !manualCode}
              className="px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {joining ? "Joining..." : "Join by Code"}
            </button>
          </form>
        </section>
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Confirm Room Code</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedRoom.testName}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">{selectedRoom.teacherName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleModalJoin}>
              <input
                autoFocus
                type="text"
                maxLength={6}
                className="w-full text-center text-4xl tracking-widest font-black p-4 mb-5 border-2 border-dashed rounded-2xl dark:bg-slate-800 dark:border-slate-700 focus:border-indigo-500 outline-none transition-all"
                value={modalCode}
                onChange={(e) => setModalCode(normalizeCode(e.target.value))}
                placeholder="XXXXXX"
              />
              <button
                type="submit"
                disabled={joining}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
              >
                {joining ? "Joining..." : "Submit Code"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveJoin;
