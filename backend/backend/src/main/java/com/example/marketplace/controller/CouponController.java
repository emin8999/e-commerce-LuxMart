@RestController
@RequestMapping("/api/coupons")
public class CouponController {
  private final CouponRepository repo;
  public CouponController(CouponRepository repo){ this.repo = repo; }
@PostMapping("/validate")
public Map<String, Object> validate(@RequestBody Map<String, Object> req) {
    String code = String.valueOf(req.getOrDefault("code", ""));
    return repo.findByCodeIgnoreCase(code)
            .map(c -> {
                boolean ok = Boolean.TRUE.equals(c.getActive()) &&
                        (c.getStartDate() == null || !LocalDate.now().isBefore(c.getStartDate())) &&
                        (c.getEndDate() == null || !LocalDate.now().isAfter(c.getEndDate())) &&
                        (c.getUsesLimit() == null || c.getUsedCount() < c.getUsesLimit());
                return Map.of(
                        "valid", ok,
                        "type", c.getType(),       // name() lazım deyil
                        "value", c.getValue(),
                        "minSubtotal", c.getMinSubtotalUSD()
                );
            }).orElse(Map.of("valid", false));
}
}