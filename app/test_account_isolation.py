import os
import sys
import time
import queue
import tempfile
import unittest
from unittest.mock import MagicMock, patch

APP_DIR = os.path.dirname(os.path.abspath(__file__))
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

import db
import watcher
from watcher import IndividualFileMonitor, IndividualFileHandler
import sync_engine


class AccountIsolationTestCase(unittest.TestCase):
    def setUp(self):
        # Create an isolated temporary directory and SQLite database for each test
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "isolated_test_sync.db")
        self.db_patcher = patch.object(db, "DB_PATH", self.db_path)
        self.db_patcher.start()
        db.init_db()

        # Disposable test files
        self.file_a = os.path.join(self.temp_dir.name, "user_a_doc.txt")
        with open(self.file_a, "w") as f:
            f.write("Account A content")

        self.file_b = os.path.join(self.temp_dir.name, "user_b_doc.txt")
        with open(self.file_b, "w") as f:
            f.write("Account B content")

    def tearDown(self):
        self.db_patcher.stop()
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    # 1. Account A's records are returned for Account A only
    def test_account_a_records_returned_for_account_a_only(self):
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a)
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b)

        records_a = db.get_tracked_individual_files(user_id="user_a")
        paths_a = [r["abs_path"] for r in records_a]
        self.assertIn(self.file_a, paths_a)
        self.assertNotIn(self.file_b, paths_a)
        self.assertEqual(len(records_a), 1)
        self.assertEqual(records_a[0]["user_id"], "user_a")

    # 2. Account B's records are returned for Account B only
    def test_account_b_records_returned_for_account_b_only(self):
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a)
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b)

        records_b = db.get_tracked_individual_files(user_id="user_b")
        paths_b = [r["abs_path"] for r in records_b]
        self.assertIn(self.file_b, paths_b)
        self.assertNotIn(self.file_a, paths_b)
        self.assertEqual(len(records_b), 1)
        self.assertEqual(records_b[0]["user_id"], "user_b")

    # 3. A missing user ID does not return all users' records (fails closed)
    def test_missing_user_id_fails_closed(self):
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a)
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b)

        records_none = db.get_tracked_individual_files(user_id=None)
        self.assertEqual(records_none, [])

        records_empty = db.get_tracked_individual_files(user_id="")
        self.assertEqual(records_empty, [])

    # 4. A fresh launch restores the current user's active monitoring records
    def test_fresh_launch_restores_current_user_active_monitoring(self):
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a, is_active=1)
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b, is_active=1)

        # Mock GUI instance
        mock_gui = MagicMock()
        mock_gui.current_user = {"id": "user_a", "email": "a@example.com"}
        mock_gui.monitor = MagicMock()

        # Import GUI method logic
        from gui import VaultCloudGUI
        VaultCloudGUI._restore_tracked_files(mock_gui)

        # Ensure track_file was called for user_a's file but NOT user_b's file
        mock_gui.monitor.track_file.assert_any_call(os.path.abspath(self.file_a))
        tracked_paths = [call_args[0][0] for call_args in mock_gui.monitor.track_file.call_args_list]
        self.assertNotIn(os.path.abspath(self.file_b), tracked_paths)

    # 5. Stopped records remain stopped
    def test_stopped_records_remain_stopped(self):
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a, is_active=0, status="Stopped")

        mock_gui = MagicMock()
        mock_gui.current_user = {"id": "user_a", "email": "a@example.com"}
        mock_gui.monitor = MagicMock()

        from gui import VaultCloudGUI
        VaultCloudGUI._restore_tracked_files(mock_gui)

        # Monitor should NOT track stopped file
        mock_gui.monitor.track_file.assert_not_called()

        # _update_file_status_ui is called; verify it was called for our file with status=Stopped.
        # Do not assert exact version/last_sync defaults as upsert_record fills those in.
        call_kwargs_list = [
            {"args": call.args, "kwargs": call.kwargs}
            for call in mock_gui._update_file_status_ui.call_args_list
        ]
        matched = any(
            c["args"] == (os.path.abspath(self.file_a),)
            and c["kwargs"].get("status") == "Stopped"
            for c in call_kwargs_list
        )
        self.assertTrue(matched, f"Expected _update_file_status_ui called with status='Stopped' for {self.file_a}")

    # 6. Foreign-account files are never registered with the watcher
    def test_foreign_account_files_never_registered_with_watcher(self):
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b, is_active=1)

        mock_gui = MagicMock()
        mock_gui.current_user = {"id": "user_a", "email": "a@example.com"}
        mock_gui.monitor = MagicMock()

        from gui import VaultCloudGUI
        # Force a record list containing a foreign file (simulating query compromise or corrupt list)
        with patch.object(db, "get_tracked_individual_files", return_value=[db.get_record(self.file_b)]):
            VaultCloudGUI._restore_tracked_files(mock_gui)

        mock_gui.monitor.track_file.assert_not_called()
        mock_gui._update_file_status_ui.assert_called_with(
            os.path.abspath(self.file_b),
            status="Stopped",
            error="Foreign account record"
        )

    # 7. Queued events from a previous account cannot upload or modify files after switching accounts
    @patch("sync_engine.sync_individual_file")
    def test_queued_event_from_previous_account_cannot_upload(self, mock_sync):
        db.upsert_record(self.file_b, user_id="user_b", sync_mode="individual", abs_path=self.file_b, is_active=1)

        mock_gui = MagicMock()
        mock_gui.drive_auth = MagicMock()
        mock_gui.current_user = {"id": "user_a", "email": "a@example.com"}

        from gui import VaultCloudGUI
        # Attempt to handle event for user_b's file while authenticated as user_a
        VaultCloudGUI._handle_tracked_file_event(mock_gui, self.file_b, "changed")

        # Must be dropped before syncing
        mock_sync.assert_not_called()

    # 8. Logout/login in the same GUI process does not crash the observer
    def test_logout_login_in_same_process_does_not_crash_observer(self):
        eq = queue.Queue()
        mon = IndividualFileMonitor(eq, debounce_seconds=0.1)
        
        # Session 1: User A
        mon.start()
        self.assertTrue(mon._started)
        self.assertTrue(mon.observer.is_alive())
        mon.track_file(self.file_a)

        # Logout User A
        mon.stop()
        self.assertFalse(mon._started)
        self.assertFalse(mon.observer.is_alive())

        # Session 2: User B in same process
        try:
            mon.start()
        except RuntimeError as e:
            self.fail(f"mon.start() raised RuntimeError after stop: {e}")

        self.assertTrue(mon._started)
        self.assertTrue(mon.observer.is_alive())
        mon.track_file(self.file_b)
        mon.stop()

    # 9. Repeated start/stop cycles do not create duplicate observers or consumers
    def test_repeated_start_stop_cycles_no_duplicates(self):
        eq = queue.Queue()
        mon = IndividualFileMonitor(eq, debounce_seconds=0.1)

        for _ in range(3):
            mon.start()
            self.assertTrue(mon._started)
            self.assertTrue(mon.observer.is_alive())
            mon.stop()
            self.assertFalse(mon._started)

        # Start once more and verify single active instance
        mon.start()
        self.assertTrue(mon.observer.is_alive())
        self.assertTrue(mon.handler._flusher_thread.is_alive())
        mon.stop()

    # 10. Same-user file monitoring continues to work after a restart
    def test_same_user_monitoring_continues_after_restart(self):
        eq = queue.Queue()
        mon = IndividualFileMonitor(eq, debounce_seconds=0.1)
        mon.start()
        mon.track_file(self.file_a)

        # Simulate restart
        mon.stop()
        mon.start()
        self.assertTrue(mon.track_file(self.file_a))
        self.assertTrue(mon.observer.is_alive())
        mon.stop()

    # 11. Editing a tracked file still updates its existing cloud ID and version
    @patch("sync_engine.upload_file")
    @patch("sync_engine.acquire_lock")
    @patch("sync_engine.release_lock")
    @patch("sync_engine.verify_account_isolation")
    def test_editing_tracked_file_updates_cloud_id_and_version(self, mock_iso, mock_rel, mock_acq, mock_upload):
        mock_auth = MagicMock()
        cloud_file_id = "cloud_doc_uuid_777"
        h1 = sync_engine.hash_file(self.file_a)

        db.upsert_record(
            self.file_a,
            local_hash=h1,
            cloud_id=cloud_file_id,
            last_synced_hash=h1,
            cloud_version=1,
            user_id="user_a",
            sync_mode="individual",
            abs_path=self.file_a,
            status="Synced"
        )

        with open(self.file_a, "a") as f:
            f.write("\nUpdated content line.")

        mock_upload.return_value = {
            "id": cloud_file_id,
            "version_number": 2,
            "content_hash": "hash_v2"
        }

        res = sync_engine.sync_individual_file(mock_auth, self.file_a, device_id="dev-test")
        self.assertEqual(res.get("version_number"), 2)

        rec = db.get_record(self.file_a)
        self.assertEqual(rec["cloud_id"], cloud_file_id)
        self.assertEqual(rec["cloud_version"], 2)
        self.assertEqual(rec["status"], "Synced")

    # 12. Existing folder-sync functionality is not broken
    def test_folder_sync_records_not_affected(self):
        db.upsert_record("docs/report.pdf", user_id="user_a", sync_mode="folder", abs_path="C:/docs/report.pdf")
        db.upsert_record(self.file_a, user_id="user_a", sync_mode="individual", abs_path=self.file_a)

        individual_records = db.get_tracked_individual_files(user_id="user_a")
        paths = [r["path"] for r in individual_records]
        self.assertIn(db.normalize_path(self.file_a), paths)
        self.assertNotIn("docs/report.pdf", paths)

        # Folder sync records still preserved in main table
        all_recs = db.all_records()
        all_paths = [r["path"] for r in all_recs]
        self.assertIn("docs/report.pdf", all_paths)


if __name__ == "__main__":
    unittest.main()

