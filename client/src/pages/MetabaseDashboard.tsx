// // Metabase Dashboard
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';  
// import { Box, CircularProgress } from 'lucide-react';

// const MetabaseDashboard: React.FC = () => {
//   const [embedUrl, setEmbedUrl] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);  


//   useEffect(() => {
//     const fetchEmbedUrl = async () => {
//       try {
//         const response = await axios.get('/api/reports/metabase/dashboard');
//         setEmbedUrl(response.data.url);
//       }
//       catch (err) {
//         setError('Failed to load dashboard. Please try again later.');
//       } 
//       finally {
//         setLoading(false);
//       }
//     };

//     fetchEmbedUrl();
//   }, []);

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" height="100%">
//         <CircularProgress />
//       </Box>
//     );
//   }
//   if (error) {
//     return <Box color="error.main">{error}</Box>;
//   }
//   return (
//     <Box height="100%" width="100%">
//       {embedUrl ? (
//         <iframe
//           src={embedUrl}
//           width="100%"
//           height="100%"
//           frameBorder="0"
//           title="Metabase Dashboard"
//         />
//       ) : (
//         <Box color="error.main">Failed to load dashboard.</Box>
//       )}
//     </Box>
//   );
// };

// export default MetabaseDashboard;
// // Metabase Dashboard
