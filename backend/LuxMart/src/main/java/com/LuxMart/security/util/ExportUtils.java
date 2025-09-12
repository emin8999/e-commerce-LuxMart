package com.LuxMart.security.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.springframework.stereotype.Component;

import com.LuxMart.dto.requestDto.user.UserListItem;
import com.LuxMart.enums.Roles;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Slf4j
public class ExportUtils {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] exportUsersToCsv(List<UserListItem> users) {
        StringBuilder csv = new StringBuilder();
        
        csv.append("ID,Name,Surname,Email,Phone,Address,Created At,Orders Count,Spend USD,Roles,Is Active\n");
        
        for (UserListItem user : users) {
            csv.append(user.getId()).append(",")
               .append(escapeCsv(user.getName())).append(",")
               .append(escapeCsv(user.getSurname())).append(",")
               .append(escapeCsv(user.getEmail())).append(",")
               .append(escapeCsv(user.getPhone())).append(",")
               .append(escapeCsv(user.getAddress())).append(",")
               .append(user.getCreatedAt() != null ? user.getCreatedAt().format(DATE_FORMATTER) : "").append(",")
               .append(user.getOrdersCount() != null ? user.getOrdersCount() : 0).append(",")
               .append(user.getSpendUSD() != null ? user.getSpendUSD() : 0.0).append(",")
               .append(escapeCsv(rolesToString(user.getRoles()))).append(",")
               .append(user.isActive()).append("\n");
        }
        
        return csv.toString().getBytes();
    }

    public byte[] exportUsersToExcel(List<UserListItem> users) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Users");
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Name", "Surname", "Email", "Phone", "Address", 
                               "Created At", "Orders Count", "Spend USD", "Roles", "Is Active"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (UserListItem user : users) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(user.getId());
                row.createCell(1).setCellValue(user.getName() != null ? user.getName() : "");
                row.createCell(2).setCellValue(user.getSurname() != null ? user.getSurname() : "");
                row.createCell(3).setCellValue(user.getEmail() != null ? user.getEmail() : "");
                row.createCell(4).setCellValue(user.getPhone() != null ? user.getPhone() : "");
                row.createCell(5).setCellValue(user.getAddress() != null ? user.getAddress() : "");
                row.createCell(6).setCellValue(user.getCreatedAt() != null ? 
                    user.getCreatedAt().format(DATE_FORMATTER) : "");
                row.createCell(7).setCellValue(user.getOrdersCount() != null ? user.getOrdersCount() : 0);
                row.createCell(8).setCellValue(user.getSpendUSD() != null ? user.getSpendUSD() : 0.0);
                row.createCell(9).setCellValue(rolesToString(user.getRoles()));
                row.createCell(10).setCellValue(user.isActive() ? "Active" : "Banned");
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(outputStream);
            return outputStream.toByteArray();
            
        } catch (IOException e) {
            log.error("Error creating Excel file", e);
            throw new RuntimeException("Failed to create Excel file", e);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        
        // CSV-də vergül və dırnak işarələrini escape et
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        
        return value;
    }

    private String rolesToString(Set<Roles> roles) {
        if (roles == null || roles.isEmpty()) {
            return "BANNED";
        }
        
        return roles.stream()
                .map(Enum::name)
                .collect(Collectors.joining(", "));
    }
}