import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getLocalUser } from "../../utils/auth";
import { UserCircle, Camera, Lock, Save, ArrowLeft, Eye, EyeOff } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUser = getLocalUser();
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    isPublic: true,
  });
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/user/${currentUser.id}`);
      const { user } = res.data;
      setFormData({
        name: user.name,
        bio: user.bio || "",
        isPublic: user.isPublic,
      });
      if (user.profilePic) {
        setPreview(`http://localhost:5000/${user.profilePic}`);
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("bio", formData.bio);
      data.append("isPublic", formData.isPublic);
      if (profilePic) {
        data.append("profilePic", profilePic);
      }

      const res = await API.put("/user/update-profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local storage user name and pic if changed
      const localUser = JSON.parse(localStorage.getItem("user"));
      localUser.name = res.data.user.name;
      localUser.profilePic = res.data.user.profilePic;
      localStorage.setItem("user", JSON.stringify(localUser));

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => navigate(`/profile/${currentUser.id}`), 1500);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match" });
    }

    setPasswordLoading(true);
    try {
      await API.put("/user/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Profile
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Info Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Edit Profile Details</h2>
            
            {message.text && (
              <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Profile Pic Upload */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={80} className="text-indigo-200" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all">
                    <Camera size={20} />
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click icon to change photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Account Privacy</label>
                  <select
                    value={formData.isPublic}
                    onChange={(e) => setFormData({...formData, isPublic: e.target.value === "true"})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-600"
                  >
                    <option value="true">Public Account</option>
                    <option value="false">Private (Request Required)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows="4"
                  placeholder="Tell the community about yourself..."
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? "Saving..." : <><Save size={22} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 h-fit sticky top-24">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Lock size={20} className="text-indigo-600" /> Security
            </h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditProfile;
