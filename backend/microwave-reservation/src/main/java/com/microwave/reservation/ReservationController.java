

import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.time.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZoneId;
import java.time.LocalTime;
import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(
  origins = "*"
)
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository repo;
    
    @Value("${admin.resetToken}")
    private String resetToken;


    public ReservationController(ReservationRepository repo) {
        this.repo = repo;
    }

    private static final ZoneId JST = ZoneId.of("Asia/Tokyo");

    private boolean isWithinAcceptanceHours(){
      return true;
      //LocalTime now = LocalTime.now(JST);
      //return !now.isBefore(LocalTime.of(8,30))
        //&& !now.isAfter(LocalTime.of(12,30));
    }

    // 全件取得
    @GetMapping
    public List<Reservation> getAll() {
        return repo.findAll();
    }

    // 予約登録
    @PostMapping
    public Reservation create(@RequestBody Reservation r) {
      
      if(!isWithinAcceptanceHours()){
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "受付時間外です"
        );
      }

      r.setStatus("WAITING");
      r.setCreatedAt(LocalDateTime.now(JST));
      return repo.save(r);
    }

    // 次の人を開始
    @PostMapping("/start")
    public Reservation startNext() {

        // 既に使用中の人がいればその人を返す（事故防止）
        Reservation using = repo.findFirstByStatusOrderByCreatedAtAsc("USING");
        if (using != null) {
            return using;
        }

        // WAITINGの中で一番古い人を取得
        Reservation next = repo.findFirstByStatusOrderByCreatedAtAsc("WAITING");

        if (next != null) {
            next.setStatus("USING");
            next.setStartTime(LocalDateTime.now(JST));
            return repo.save(next);
        }

        return null;
    }

    // 現在使用中の人
    @GetMapping("/current")
    public Reservation current() {
        return repo.findFirstByStatusOrderByCreatedAtAsc("USING");
    }

    // 待機リスト
    @GetMapping("/waiting")
    public List<Reservation> waiting() {
        return repo.findAll()
                .stream()
                .filter(r -> "WAITING".equals(r.getStatus()))
                .toList();
    }

    // 完了
    @PostMapping("/{id}/complete")
    public Reservation complete(@PathVariable Long id) {
        Reservation r = repo.findById(id).orElseThrow();
        r.setStatus("DONE");
        return repo.save(r);
    }

    // 全削除（リセット）
    @PostMapping("/reset")
    public void reset(@RequestParam String token, HttpServletRequest request){

      String ip = request.getRemoteAddr();

      if(!ip.equals("127.0.0.1") && !ip.equals("::1")){
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
      }

      if(!resetToken.equals(token)){
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
      }
      repo.deleteAll();
    }
}


