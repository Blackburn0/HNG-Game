// The built-in song list: official YouTube videos from each artist's own channel
// (Abefe's come from the "Abefe - Topic" channel YouTube runs for label uploads).
// To add a song, copy the id from its YouTube link: youtube.com/watch?v=<id>.

export const SONGS = [
  { id: '3Iyuym-Gci0', title: 'Fall', artist: 'Davido' },
  { id: 'helEv0kGHd4', title: 'If', artist: 'Davido' },
  { id: 'ucVJrja8r6Q', title: 'Assurance', artist: 'Davido' },
  { id: 'OSBan_sH_b8', title: 'Unavailable (ft. Musa Keys)', artist: 'Davido' },
  { id: 'GoWGGiWDsac', title: 'Feel', artist: 'Davido' },
  { id: 'l6QMJniQWxQ', title: 'Jowo', artist: 'Davido' },

  { id: 'jipQpjUA_o8', title: 'Essence (ft. Tems)', artist: 'Wizkid' },
  { id: 'Q7QiLceJSLQ', title: 'Ojuelegba', artist: 'Wizkid' },
  { id: 'FCUk7rIBBAE', title: 'Joro', artist: 'Wizkid' },
  { id: 'vqW18C4plZ8', title: 'Come Closer (ft. Drake)', artist: 'Wizkid' },
  { id: '1VrWaED18_g', title: 'Soco', artist: 'Wizkid' },
  { id: 'haA7DpK9Z4k', title: 'Fever', artist: 'Wizkid' },

  { id: '1n6PP_At3BY', title: 'Ire', artist: 'Adekunle Gold' },
  { id: 'juBnNBm0cPw', title: 'High (ft. Davido)', artist: 'Adekunle Gold' },
  { id: 'VnXq06m9P4g', title: 'Party No Dey Stop (ft. Zinoleesky)', artist: 'Adekunle Gold' },
  { id: 'ynCkE3kYI10', title: 'Orente', artist: 'Adekunle Gold' },
  { id: 'XvD9hW1DMrk', title: '5 Star', artist: 'Adekunle Gold' },

  { id: 'nxpeHCepqzo', title: 'Abefeholics', artist: 'Abefe' },
  { id: 'ellxfk-x_84', title: 'Orekelewa', artist: 'Abefe' },
  { id: '9WcwJNUAppk', title: 'Romeo and Juliet', artist: 'Abefe' },
  { id: 'KWjnhCWrvmI', title: 'Achalugo', artist: 'Abefe' },

  { id: '421w1j87fEM', title: 'Last Last', artist: 'Burna Boy' },
  { id: 'lPe09eE6Xio', title: 'Ye', artist: 'Burna Boy' },
  { id: 'Ecl8Aod0Tl0', title: 'On The Low', artist: 'Burna Boy' },
  { id: 'hLDQ88vAhIs', title: 'City Boys', artist: 'Burna Boy' },

  { id: 'bbVZo4Yw7pI', title: 'Lonely At The Top', artist: 'Asake' },
  { id: '5A-CjKOQWvg', title: 'Sungba', artist: 'Asake' },
  { id: 'qrIP_igi76U', title: 'Terminator', artist: 'Asake' },

  { id: 'CQLsdm1ZYAw', title: 'Calm Down', artist: 'Rema' },
  { id: 'zUU1bIWpH5c', title: 'Dumebi', artist: 'Rema' },
  { id: 'dNt1QR1ecuM', title: 'Charm', artist: 'Rema' },

  { id: 'crtQSTYWtqE', title: 'Rush', artist: 'Ayra Starr' },
  { id: 'zcR0PWGfUhs', title: 'Bloody Samaritan', artist: 'Ayra Starr' },
  { id: 'EhyzYPSHRQU', title: 'Commas', artist: 'Ayra Starr' },
].map((s) => ({
  ...s,
  art: `https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`,
  link: `https://www.youtube.com/watch?v=${s.id}`,
}));
