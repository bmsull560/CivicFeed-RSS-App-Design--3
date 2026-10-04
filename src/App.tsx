import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import FeedDirectory from "./pages/FeedDirectory";
import FeedDetail from "./pages/FeedDetail";
import TimelinePage from "./pages/TimelinePage";
import TraceHistoryPage from "./pages/TraceHistoryPage";
import ResearchWorkspacePage from "./pages/ResearchWorkspacePage";
import ResearchProjectPage from "./pages/ResearchProjectPage";
import ComparisonPage from "./pages/ComparisonPage";
import TopicPage from "./pages/TopicPage";
import EntityPage from "./pages/EntityPage";
import ExplorePage from "./pages/ExplorePage";

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feeds" element={<FeedDirectory />} />
          <Route path="/feed/:id" element={<FeedDetail />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/trace/:topicId" element={<TraceHistoryPage />} />
          <Route path="/research" element={<ResearchWorkspacePage />} />
          <Route path="/research/:id" element={<ResearchProjectPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/topic/:slug" element={<TopicPage />} />
          <Route path="/entity/:id" element={<EntityPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
