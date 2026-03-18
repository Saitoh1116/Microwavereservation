package com.microwave.reservation;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({"/", "/register", "/register/complete", "/display"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
