"use client";
import { useEffect, useState,useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import io from "socket.io-client";


const socket = io(process.env.NEXT_PUBLIC_WEBSITE_URL, {
  transports: ["websocket"],
  reconnection: true,
});


function EndChat({astrologerData, timeLeft, setTimeLeft}) {
  

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const [astrologerNotificationStatus, setAstrologerNotificationStatus] =   useState();
  const [totalChatTime, setTotalChatTime] =   useState();
  const [astrologerId, setAstrologerId ]=   useState();
  const [userIds, setUserIds]=   useState();

useEffect(()=>{
  const totalChatTime = Math.round(localStorage.getItem("totalChatTime"));
  const astrologerId = localStorage.getItem("astrologerId");
  const userIds = localStorage.getItem("userIds");

  setTotalChatTime(totalChatTime)
  setAstrologerId(astrologerId)
  setUserIds(userIds)
},[])


  useEffect(() => {
    let storedNotification = localStorage.getItem(
      "AstrologerNotificationStatus"
    );
    if (storedNotification) {
      setAstrologerNotificationStatus(storedNotification);
    }
  }, []);

   setTimeLeft(() => {
    // Initialize timeLeft from localStorage or set to a default value
    const storedTime = localStorage.getItem("chatTimeLeft");
    return storedTime
      ? parseInt(storedTime, 10)
      : astrologerNotificationStatus == false
      ? 0
      : null;
  });

  const isChatEnded = useRef(false);

  const endChatStatus = async () => {
    if (isChatEnded.current) return;
    isChatEnded.current = true;
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    try {
      const   response = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/update-astro-status-by-mobile/${astrologerData.mobileNumber}`,
        {
          chatStatus: false,
        }
      );

      if (response.data.message === "Success") {
        toast.error("Call Rejected", {
          position: "top-right",
        });

        // Update state and localStorage
        setTimeLeft(null);
        localStorage.removeItem("chatTimeLeft");

        const updatedAstrologerData = response.data.updatedProfile;
        socket.emit("astrologer-chat-status", updatedAstrologerData);

        const newUserDetail = {
          userId: userIds,
          totalChatTime: totalChatTime,
        };
        socket.emit("chat-timeLeft-update", newUserDetail);
        console.log(newUserDetail);

        // Update AstrologerNotificationStatus in localStorage and state
        localStorage.setItem(
          "AstrologerNotificationStatus",
          updatedAstrologerData.chatStatus
        );
        setAstrologerNotificationStatus(updatedAstrologerData.chatStatus);

        console.log("Astrologer status updated:", updatedAstrologerData);
      }
    } catch (error) {
      console.error(
        "Failed to update astrologer status:",
        error.response?.data?.error || error.message
      );
    }
  };

  useEffect(() => {
    if (astrologerNotificationStatus == undefined) {
      return;
    }

    if (
      astrologerNotificationStatus === "true" ||
      astrologerNotificationStatus === true
    ) {
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setTimeLeft((prevTime) => {
            const newTime = prevTime + 1;
            localStorage.setItem("chatTimeLeft", newTime.toString());
            localStorage.setItem("totalChatTime", newTime.toString());
            return newTime;
          });
        }, 1000);

        return () => {
          clearTimeout(timeoutRef.current);
          clearInterval(intervalRef.current);
          console.log("Timer cleared");
        };
      }, 100);
    } else {
      setTimeLeft(null);
      localStorage.removeItem("chatTimeLeft");
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
      const newUserDetail = {
        userId: userIds,
        totalChatTime: 0,
      };
      socket.emit("chat-timeLeft-update", newUserDetail);
      console.log("not working this");
    }
  }, [astrologerNotificationStatus]);

  useEffect(() => {
    if (timeLeft === 0 && !isChatEnded.current) {
      endChatStatus();
    }
  }, [timeLeft]);


  //   let userTotalAmount = 20;
//   let astroChatPricePerMinute = 10;
//   useEffect(() => {
//     if (totalChatTime > 0) {
//       const intervals = Math.ceil(totalChatTime / 60);
//       const amount = intervals * astroChatPricePerMinute;
// console.log(Math.abs(userTotalAmount - amount) ==0 );

//       // Automatically call EndChatStatus if the condition is met
//       if (Math.abs(userTotalAmount - amount) == 0) {
//         console.log("Automatically ending chat due to balance exhaustion.");
//         endChatStatus();
//       }
//     }
//   }, [totalChatTime]);

  // useEffect(() => {
  //   if (timeLeft === null && !isChatEnded.current) {
  //     endChatStatus();
  //   }
  // }, [timeLeft]);
 

  const handleEndChatClick = () => {
    console.log("End chat button clicked.");
    endChatStatus();
  };
  return (
    <div className="chat-right-end-btn">
      <button onClick={handleEndChatClick}>End</button>
    </div>
  );
};

export default EndChat;
